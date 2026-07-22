import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbPromise } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import 'dotenv/config';

const router = express.Router();
const secret = process.env.JWT_SECRET || 'fallback_secret_protrack_2024';

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const db = await dbPromise;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    
    res.status(201).json({ id: result.lastID, username });
  } catch (err) {
    console.error('Registration Error:', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Error creating user', details: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await dbPromise;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { userId: user.id, username: user.username };
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login', details: err.message });
  }
});

// Change Password
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = await dbPromise;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ message: 'Server error during password update', details: err.message });
  }
});

export default router;
