import express from 'express';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

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
    
    res.status(201).json({ 
      id: result.lastID, 
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
    const result = await db.run('DELETE FROM meetings WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    console.error('Delete Meeting Error:', err);
    res.status(500).json({ message: 'Error deleting meeting' });
  }
});

export default router;
