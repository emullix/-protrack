import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../protrack.db');

// GET /api/backup - Download the SQLite database
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ message: 'Database file not found' });
    }
    res.download(dbPath, 'protrack_backup.db');
  } catch (err) {
    console.error('Backup Error:', err);
    res.status(500).json({ message: 'Error creating database backup' });
  }
});

// POST /api/backup/restore - Restore the database using raw binary buffer
router.post('/restore', authMiddleware, express.raw({ type: 'application/octet-stream', limit: '50mb' }), async (req, res) => {
  try {
    const buffer = req.body;
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ message: 'No database file provided' });
    }

    const db = await dbPromise;
    
    // Close the current db connection to release the file handle
    await db.close();
    
    // Overwrite the database file
    fs.writeFileSync(dbPath, buffer);
    
    res.json({ message: 'Database restored successfully. Server is restarting.' });
    
    // Exit the process so PM2 or nodemon can reboot the server with the new DB
    setTimeout(() => {
      console.log('Database restored. Restarting server process...');
      process.exit(0);
    }, 500);
    
  } catch (err) {
    console.error('Restore Error:', err);
    res.status(500).json({ message: 'Error restoring database' });
  }
});

export default router;
