import express from 'express';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';
import { updateProjectStatus } from '../utils/projectStatusUpdater.js';

const router = express.Router();

// GET /projects
router.get('/', authMiddleware, async (req, res) => {
  const db = await dbPromise;
  
  // Recalculate status for all user's projects before returning
  const initialProjects = await db.all('SELECT id FROM projects WHERE user_id = ?', [req.user.userId]);
  for (const p of initialProjects) {
    await updateProjectStatus(db, p.id, req.user.userId);
  }
  
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
    'INSERT INTO projects (user_id, title, description, status, deadline, priority, tags) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [req.user.userId, name, description, 'Active', deadline, priority || 'Medium', Array.isArray(tags) ? tags.join(',') : tags]
  );
  
  const projectId = result.lastID;
  
  await logActivity(req.user.userId, 'create', 'project', projectId, name, `Creado el proyecto "${name}"`);
  
  if (teamIds && Array.isArray(teamIds)) {
    for (const memberId of teamIds) {
      await db.run('INSERT INTO project_members (project_id, member_id) VALUES (?, ?)', [projectId, memberId]);
    }
  }
  
  res.status(201).json({ id: projectId, title: name, description, status: 'Active', deadline, priority: priority || 'Medium', teamIds, tags });
});

// PUT /projects/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description, status, priority, deadline, teamIds, tags } = req.body;
  const db = await dbPromise;
  
  const project = await db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const normalizeProjectStatus = (s) => {
    if (!s) return 'In Progress';
    const lower = s.toLowerCase();
    if (lower === 'active') return 'Active';
    if (lower === 'in progress') return 'In Progress';
    if (lower === 'completed') return 'Completed';
    if (lower === 'at risk') return 'At Risk';
    if (lower === 'on hold') return 'On Hold';
    return s;
  };

  const oldStatus = normalizeProjectStatus(project.status);
  const newStatus = normalizeProjectStatus(status || project.status);
  const oldTitle = project.title;
  const newTitle = name || project.title;

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

  if (oldStatus !== newStatus) {
    const statusMap = {
      'Active': 'Activo',
      'In Progress': 'En progreso',
      'Completed': 'Completado',
      'At Risk': 'En riesgo',
      'On Hold': 'En espera'
    };
    const oldStatusSp = statusMap[oldStatus] || oldStatus;
    const newStatusSp = statusMap[newStatus] || newStatus;
    const detailsText = `Cambió el estado del proyecto "${newTitle}" de "${oldStatusSp}" a "${newStatusSp}"`;
    
    await logActivity(req.user.userId, 'update_status', 'project', req.params.id, newTitle, detailsText);
  }
  
  res.json({ message: 'Project updated' });
});

// DELETE /projects/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const db = await dbPromise;
  
  const project = await db.get('SELECT title FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  
  await db.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  
  await logActivity(req.user.userId, 'delete', 'project', req.params.id, project.title, `Eliminó el proyecto "${project.title}"`);
  
  res.json({ message: 'Project deleted' });
});

export default router;
