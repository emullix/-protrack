import express from 'express';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /members
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await dbPromise;
    const members = await db.all('SELECT * FROM members WHERE user_id = ?', [req.user.userId]);
    res.json(members);
  } catch (err) {
    console.error('List Members Error:', err);
    res.status(500).json({ message: 'Error retrieving members' });
  }
});

// POST /members
router.post('/', authMiddleware, async (req, res) => {
  const { name, email, role, avatar } = req.body;
  console.log('Creating member with body:', req.body);
  
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    const db = await dbPromise;
    const result = await db.run(
      'INSERT INTO members (user_id, name, email, role, avatar) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, name, email, role, avatar]
    );
    
    res.status(201).json({ 
      id: result.lastID, 
      name, 
      email, 
      role, 
      avatar 
    });
  } catch (err) {
    console.error('Create Member Error:', err);
    res.status(500).json({ message: 'Error creating member' });
  }
});

// PUT /members/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, email, role, avatar } = req.body;
  try {
    const db = await dbPromise;
    const member = await db.get('SELECT * FROM members WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await db.run(
      'UPDATE members SET name = ?, email = ?, role = ?, avatar = ? WHERE id = ?',
      [
        name || member.name, 
        email || member.email, 
        role || member.role, 
        avatar || member.avatar, 
        req.params.id
      ]
    );
    
    res.json({ message: 'Member updated' });
  } catch (err) {
    console.error('Update Member Error:', err);
    res.status(500).json({ message: 'Error updating member' });
  }
});

// DELETE /members/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await dbPromise;
    const result = await db.run('DELETE FROM members WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json({ message: 'Member deleted' });
  } catch (err) {
    console.error('Delete Member Error:', err);
    res.status(500).json({ message: 'Error deleting member' });
  }
});

export default router;
