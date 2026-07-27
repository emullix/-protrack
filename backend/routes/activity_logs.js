import express from 'express';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /activities
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await dbPromise;
    
    // Recuperar las últimas 100 actividades asociadas al usuario actual
    const logs = await db.all(`
      SELECT al.*, u.username as userName
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC
      LIMIT 100
    `, [req.user.userId]);
    
    res.json(logs);
  } catch (err) {
    console.error('List Activities Error:', err);
    res.status(500).json({ message: 'Error al recuperar la bitácora de actividades' });
  }
});

export default router;
