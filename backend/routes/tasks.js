import express from 'express';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /tasks
router.get('/', authMiddleware, async (req, res) => {
  const { projectId } = req.query;
  const db = await dbPromise;
  let tasks;
  
  if (projectId) {
    tasks = await db.all(`
      SELECT tasks.* FROM tasks 
      JOIN projects ON tasks.project_id = projects.id 
      WHERE tasks.project_id = ? AND projects.user_id = ?
    `, [projectId, req.user.userId]);
  } else {
    tasks = await db.all(`
      SELECT tasks.* FROM tasks 
      JOIN projects ON tasks.project_id = projects.id 
      WHERE projects.user_id = ?
      ORDER BY tasks.position ASC, tasks.created_at ASC
    `, [req.user.userId]);
  }
  res.json(tasks);
});

// POST /tasks
router.post('/', authMiddleware, async (req, res) => {
  const { project_id, title, description, due_date, assignee_id, priority } = req.body;
  const db = await dbPromise;
  
  if (!project_id || !title) return res.status(400).json({ message: 'Project ID and Title are required' });

  // Verify project ownership
  const project = await db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [project_id, req.user.userId]);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  // Get max position for this project
  const { maxPos } = await db.get('SELECT MAX(position) as maxPos FROM tasks WHERE project_id = ?', [project_id]) || { maxPos: 0 };
  const position = (maxPos || 0) + 1;

  const result = await db.run(
    'INSERT INTO tasks (project_id, title, description, due_date, assignee_id, priority, position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)', 
    [project_id, title, description, due_date, assignee_id, priority || 'Medium', position]
  );
  
  res.status(201).json({ id: result.lastID, project_id, title, description, due_date, assignee_id, priority: priority || 'Medium' });
});

// PUT /tasks/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, status, due_date, assignee_id, priority } = req.body;
  const db = await dbPromise;
  
  const task = await db.get(`
    SELECT tasks.* FROM tasks 
    JOIN projects ON tasks.project_id = projects.id 
    WHERE tasks.id = ? AND projects.user_id = ?
  `, [req.params.id, req.user.userId]);
  
  if (!task) return res.status(404).json({ message: 'Task not found' });

  await db.run(
    'UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ?, assignee_id = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [
      title || task.title, 
      description || task.description, 
      status || task.status, 
      due_date || task.due_date, 
      assignee_id !== undefined ? assignee_id : task.assignee_id,
      priority || task.priority,
      req.params.id
    ]
  );
  
  res.json({ message: 'Task updated' });
});

// DELETE /tasks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const db = await dbPromise;
  
  const task = await db.get(`
    SELECT tasks.* FROM tasks 
    JOIN projects ON tasks.project_id = projects.id 
    WHERE tasks.id = ? AND projects.user_id = ?
  `, [req.params.id, req.user.userId]);

  if (!task) return res.status(404).json({ message: 'Task not found' });

  await db.run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  
  res.json({ message: 'Task deleted' });
});

// POST /tasks/reorder
router.post('/reorder', authMiddleware, async (req, res) => {
  const { taskOrders } = req.body; // Array of { id, position }
  const db = await dbPromise;

  if (!Array.isArray(taskOrders) || taskOrders.length === 0) return res.status(400).json({ message: 'taskOrders must be a non-empty array' });

  try {
    const ids = taskOrders.map(item => item.id);
    const caseBranches = taskOrders.map(item => `WHEN id = ? THEN ?`).join(' ');
    const params = [];
    taskOrders.forEach(item => {
      params.push(item.id, item.position);
    });
    params.push(ids); // For the WHERE IN clause

    // SQLite doesn't support array params in IN directly with ?, but we can build it
    const placeholders = ids.map(() => '?').join(',');
    
    const query = `
      UPDATE tasks 
      SET 
        position = CASE ${caseBranches} ELSE position END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    const finalParams = [...params.slice(0, -1), ...ids];

    await db.run(query, finalParams);
    res.json({ message: 'Tasks reordered successfully' });
  } catch (err) {
    console.error('Reorder error:', err);
    res.status(500).json({ message: 'Failed to reorder tasks' });
  }
});

export default router;
