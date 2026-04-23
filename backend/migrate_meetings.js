import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'protrack.db');

async function migrate() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    console.log('Adding member_id to meetings table...');
    await db.run('ALTER TABLE meetings ADD COLUMN member_id INTEGER REFERENCES members(id) ON DELETE SET NULL');
    console.log('Migration successful!');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Column member_id already exists.');
    } else {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  } finally {
    await db.close();
  }
}

migrate();
