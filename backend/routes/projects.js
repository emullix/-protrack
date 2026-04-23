import express from 'express';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /projects
router.get('/', authMiddleware, async (req, res) => {
  const db = await dbPromise;
  const projects = await db.all('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [req.user.userId]);
  
  // Fetch team members for each project
  for (const project of projects) {
    const team = await db.all(`
      SELECT m.* FROM members m
      JOIN project_members pm ON m.id = pm.member_id
      WHERE pm.project_id = ?
    `, [project.id]);
    project.team = team;
  }
  
  res.json(projects);
});

// POST /projects
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, deadline, priority, teamIds, tags } = req.body;
  const db = await dbPromise;
  
  if (!name) return res.status(400).json({ message: 'Name (title) is required' });

  const result = await db.run(
    'INSERT INTO projects (user_id, title, description, deadline, priority, tags) VALUES (?, ?, ?, ?, ?, ?)', 
    [req.user.userId, name, description, deadline, priority || 'Medium', Array.isArray(tags) ? tags.join(',') : tags]
  );
  
  const projectId = result.lastID;
  
  if (teamIds && Array.isArray(teamIds)) {
    for (const memberId of teamIds) {
      await db.run('INSERT INTO project_members (project_id, member_id) VALUES (?, ?)', [projectId, memberId]);
    }
  }
  
  res.status(201).json({ id: projectId, title: name, description, deadline, priority: priority || 'Medium', teamIds, tags });
});

// PUT /projects/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description, status, priority, deadline, teamIds, tags } = req.body;
  const db = await dbPromise;
  
  const project = await db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  await db.run(
    'UPDATE projects SET title = ?, description = ?, status = ?, priority = ?, deadline = ?, tags = ? WHERE id = ?', 
    [
      name || project.title, 
      description || project.description, 
      status || project.status,
      priority || project.priority,
      deadline || project.deadline,
      tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : project.tags,
      req.params.id
    ]
  );
  
  // Update team members: clear and re-add
  if (teamIds && Array.isArray(teamIds)) {
    await db.run('DELETE FROM project_members WHERE project_id = ?', [req.params.id]);
    for (const memberId of teamIds) {
      await db.run('INSERT INTO project_members (project_id, member_id) VALUES (?, ?)', [req.params.id, memberId]);
    }
  }
  
  res.json({ message: 'Project updated' });
});

// DELETE /projects/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const db = await dbPromise;
  const result = await db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
  
  if (result.changes === 0) return res.status(404).json({ message: 'Project not found' });
  
  res.json({ message: 'Project deleted' });
});

export default router;
