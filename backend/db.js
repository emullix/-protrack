import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPromise = open({
  filename: path.join(__dirname, 'protrack.db'),
  driver: sqlite3.Database
});

const initializeDb = async () => {
  const db = await dbPromise;
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'In Progress',
      priority TEXT DEFAULT 'Medium',
      deadline TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'To Do',
      priority TEXT DEFAULT 'Medium',
      assignee_id INTEGER,
      due_date DATETIME,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES members(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT,
      attendees INTEGER DEFAULT 1,
      description TEXT,
      status TEXT DEFAULT 'Upcoming',
      project_id INTEGER,
      task_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      PRIMARY KEY (project_id, member_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed members if empty
  const memberCount = await db.get('SELECT COUNT(*) as count FROM members');
  if (memberCount.count === 0) {
    const defaultMembers = [
      ['Alex Johnson', 'alex@protrack.com', 'Project Manager', 'https://picsum.photos/seed/alex/100/100'],
      ['Sarah Chen', 'sarah@protrack.com', 'Lead Developer', 'https://picsum.photos/seed/sarah/100/100'],
      ['Michael Ross', 'michael@protrack.com', 'UI/UX Designer', 'https://picsum.photos/seed/michael/100/100'],
      ['Emily Davis', 'emily@protrack.com', 'QA Engineer', 'https://picsum.photos/seed/emily/100/100'],
      ['David Wilson', 'david@protrack.com', 'Backend Developer', 'https://picsum.photos/seed/david/100/100']
    ];
    
    // We need a default user_id. For seeding, we'll try to find the first user or use 1.
    const user = await db.get('SELECT id FROM users LIMIT 1');
    const userId = user ? user.id : 1;

    for (const [name, email, role, avatar] of defaultMembers) {
      await db.run(
        'INSERT INTO members (user_id, name, email, role, avatar) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, role, avatar]
      );
    }
  }

  // Seed roles if empty
  const roleCount = await db.get('SELECT COUNT(*) as count FROM roles');
  if (roleCount.count === 0) {
    const defaultRoles = [
      ['Project Manager', 'Oversees project timelines and team coordination.', 'bg-brand-500'],
      ['Lead Developer', 'Technical lead for development and architecture.', 'bg-emerald-500'],
      ['UI/UX Designer', 'Responsible for design systems and user experience.', 'bg-purple-500'],
      ['QA Engineer', 'Ensures quality and performance through testing.', 'bg-amber-500'],
      ['Backend Developer', 'Manages server-side logic and database structures.', 'bg-blue-500'],
      ['Admin', 'Full administrative access to the platform.', 'bg-rose-500']
    ];

    const user = await db.get('SELECT id FROM users LIMIT 1');
    const userId = user ? user.id : 1;

    for (const [name, description, color] of defaultRoles) {
      await db.run(
        'INSERT INTO roles (user_id, name, description, color) VALUES (?, ?, ?, ?)',
        [userId, name, description, color]
      );
    }
  }
  
  return db;
};

export { dbPromise, initializeDb };
