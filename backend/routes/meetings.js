import express from 'express';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// GET /meetings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await dbPromise;
    const meetings = await db.all(`
      SELECT m.*, p.title as projectName, t.title as taskName 
      FROM meetings m
      LEFT JOIN projects p ON m.project_id = p.id
      LEFT JOIN tasks t ON m.task_id = t.id
      WHERE m.user_id = ?
      ORDER BY m.date ASC, m.time ASC
    `, [req.user.userId]);
    res.json(meetings);
  } catch (err) {
    console.error('List Meetings Error:', err);
    res.status(500).json({ message: 'Error retrieving meetings' });
  }
});

// POST /meetings
router.post('/', authMiddleware, async (req, res) => {
  const { title, date, time, location, attendees, description, status, project_id, task_id, member_id } = req.body;
  
  if (!title || !date || !time) {
    return res.status(400).json({ message: 'Title, date, and time are required' });
  }

  try {
    const db = await dbPromise;
    const result = await db.run(
      'INSERT INTO meetings (user_id, title, date, time, location, attendees, description, status, project_id, task_id, member_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, title, date, time, location, attendees || 1, description, status || 'Upcoming', project_id || null, task_id || null, member_id || null]
    );
    
    const meetingId = result.lastID;
    
    // Log activity
    let detailsText = '';
    let entityType = 'project';
    let entityId = project_id || null;
    let entityName = '';
    
    if (status === 'Comment') {
      if (task_id) {
        const task = await db.get('SELECT title FROM tasks WHERE id = ?', [task_id]);
        entityType = 'task';
        entityId = task_id;
        entityName = task ? task.title : 'Tarea';
        detailsText = `Comentó en la tarea "${entityName}": "${description}"`;
      } else if (project_id) {
        const project = await db.get('SELECT title FROM projects WHERE id = ?', [project_id]);
        entityType = 'project';
        entityId = project_id;
        entityName = project ? project.title : 'Proyecto';
        detailsText = `Comentó en el proyecto "${entityName}": "${description}"`;
      } else {
        entityType = 'project';
        detailsText = `Agregó un comentario: "${description}"`;
      }
      await logActivity(req.user.userId, 'comment', entityType, entityId || 0, entityName || 'Comentario', detailsText);
    } else {
      let entityType = 'project';
      let entityId = project_id || 0;
      let entityName = title;
      detailsText = `Programó la reunión "${title}"`;
      
      if (task_id) {
        const task = await db.get('SELECT title FROM tasks WHERE id = ?', [task_id]);
        entityType = 'task';
        entityId = task_id;
        entityName = task ? task.title : 'Tarea';
        detailsText = `Programó la reunión "${title}" para la tarea "${entityName}"`;
      } else if (project_id) {
        const project = await db.get('SELECT title FROM projects WHERE id = ?', [project_id]);
        entityType = 'project';
        entityId = project_id;
        entityName = project ? project.title : '';
      }
      await logActivity(req.user.userId, 'create', entityType, entityId, entityName, detailsText);
    }
    
    res.status(201).json({ 
      id: meetingId, 
      title, date, time, location, attendees, description, status, project_id, task_id, member_id
    });
  } catch (err) {
    console.error('Create Meeting Error:', err);
    res.status(500).json({ message: 'Error creating meeting' });
  }
});

// PUT /meetings/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, date, time, location, attendees, description, status, project_id, task_id, member_id } = req.body;
  try {
    const db = await dbPromise;
    const meeting = await db.get('SELECT * FROM meetings WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const oldStatus = meeting.status;
    const newStatus = status || meeting.status;
    const finalTitle = title || meeting.title;

    await db.run(
      'UPDATE meetings SET title = ?, date = ?, time = ?, location = ?, attendees = ?, description = ?, status = ?, project_id = ?, task_id = ?, member_id = ? WHERE id = ?',
      [
        title || meeting.title, 
        date || meeting.date, 
        time || meeting.time, 
        location !== undefined ? location : meeting.location, 
        attendees || meeting.attendees, 
        description !== undefined ? description : meeting.description, 
        status || meeting.status,
        project_id !== undefined ? project_id : meeting.project_id,
        task_id !== undefined ? task_id : meeting.task_id,
        member_id !== undefined ? member_id : meeting.member_id,
        req.params.id
      ]
    );

    if (oldStatus !== newStatus) {
      let entityType = 'project';
      let entityId = meeting.project_id || 0;
      let entityName = finalTitle;
      
      if (meeting.task_id) {
        const task = await db.get('SELECT title FROM tasks WHERE id = ?', [meeting.task_id]);
        entityType = 'task';
        entityId = meeting.task_id;
        entityName = task ? task.title : 'Tarea';
      } else if (meeting.project_id) {
        const project = await db.get('SELECT title FROM projects WHERE id = ?', [meeting.project_id]);
        entityName = project ? project.title : '';
      }

      if (newStatus === 'Completed') {
        await logActivity(req.user.userId, 'complete', entityType, entityId, entityName, `Completó la reunión "${finalTitle}"`);
      } else if (newStatus === 'Cancelled') {
        await logActivity(req.user.userId, 'cancel', entityType, entityId, entityName, `Canceló la reunión "${finalTitle}"`);
      }
    } else if (newStatus === 'Comment' && description !== undefined && description !== meeting.description) {
      let entityName = '';
      if (meeting.task_id) {
        const task = await db.get('SELECT title FROM tasks WHERE id = ?', [meeting.task_id]);
        entityName = task ? task.title : 'Tarea';
      } else if (meeting.project_id) {
        const project = await db.get('SELECT title FROM projects WHERE id = ?', [meeting.project_id]);
        entityName = project ? project.title : 'Proyecto';
      }
      await logActivity(req.user.userId, 'update_comment', meeting.task_id ? 'task' : 'project', meeting.task_id || meeting.project_id || 0, entityName || 'Comentario', `Actualizó su comentario en "${entityName}": "${description}"`);
    }
    
    res.json({ message: 'Meeting updated' });
  } catch (err) {
    console.error('Update Meeting Error:', err);
    res.status(500).json({ message: 'Error updating meeting' });
  }
});

// DELETE /meetings/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await dbPromise;
    const meeting = await db.get('SELECT * FROM meetings WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    await db.run('DELETE FROM meetings WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    
    if (meeting.status === 'Comment') {
      let entityName = '';
      if (meeting.task_id) {
        const task = await db.get('SELECT title FROM tasks WHERE id = ?', [meeting.task_id]);
        entityName = task ? task.title : 'Tarea';
      } else if (meeting.project_id) {
        const project = await db.get('SELECT title FROM projects WHERE id = ?', [meeting.project_id]);
        entityName = project ? project.title : 'Proyecto';
      }
      await logActivity(req.user.userId, 'delete_comment', meeting.task_id ? 'task' : 'project', meeting.task_id || meeting.project_id || 0, entityName || 'Comentario', `Eliminó un comentario en "${entityName || 'Comentario'}"`);
    } else {
      let entityType = 'project';
      let entityId = meeting.project_id || 0;
      let entityName = meeting.title;
      
      if (meeting.task_id) {
        const task = await db.get('SELECT title FROM tasks WHERE id = ?', [meeting.task_id]);
        entityType = 'task';
        entityId = meeting.task_id;
        entityName = task ? task.title : 'Tarea';
      } else if (meeting.project_id) {
        const project = await db.get('SELECT title FROM projects WHERE id = ?', [meeting.project_id]);
        entityName = project ? project.title : '';
      }
      await logActivity(req.user.userId, 'delete', entityType, entityId, entityName, `Eliminó la reunión "${meeting.title}"`);
    }
    
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    console.error('Delete Meeting Error:', err);
    res.status(500).json({ message: 'Error deleting meeting' });
  }
});

export default router;
