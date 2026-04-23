import express from 'express';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /roles
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await dbPromise;
    const roles = await db.all('SELECT * FROM roles WHERE user_id = ?', [req.user.userId]);
    res.json(roles);
  } catch (err) {
    console.error('List Roles Error:', err);
    res.status(500).json({ message: 'Error retrieving roles' });
  }
});

// POST /roles
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Role name is required' });
  }

  try {
    const db = await dbPromise;
    const result = await db.run(
      'INSERT INTO roles (user_id, name, description, color) VALUES (?, ?, ?, ?)',
      [req.user.userId, name, description, color || 'bg-brand-500']
    );
    
    res.status(201).json({ 
      id: result.lastID, 
      name, 
      description, 
      color: color || 'bg-brand-500' 
    });
  } catch (err) {
    console.error('Create Role Error:', err);
    res.status(500).json({ message: 'Error creating role' });
  }
});

// PUT /roles/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description, color } = req.body;
  try {
    const db = await dbPromise;
    const role = await db.get('SELECT * FROM roles WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await db.run(
      'UPDATE roles SET name = ?, description = ?, color = ? WHERE id = ?',
      [
        name || role.name, 
        description !== undefined ? description : role.description, 
        color || role.color, 
        req.params.id
      ]
    );
    
    res.json({ message: 'Role updated' });
  } catch (err) {
    console.error('Update Role Error:', err);
    res.status(500).json({ message: 'Error updating role' });
  }
});

// DELETE /roles/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await dbPromise;
    const result = await db.run('DELETE FROM roles WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error('Delete Role Error:', err);
    res.status(500).json({ message: 'Error deleting role' });
  }
});

export default router;
