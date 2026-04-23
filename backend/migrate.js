import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const db = await open({
    filename: path.join(__dirname, 'protrack.db'),
    driver: sqlite3.Database
  });

  console.log('Checking database schema...');

  const tableInfo = await db.all("PRAGMA table_info(projects)");
  const columns = tableInfo.map(c => c.name);

  if (columns.length === 0) {
    console.log('Projects table might not exist yet. It will be created when the app starts.');
  } else {
    if (!columns.includes('priority')) {
      console.log('Adding priority column to projects...');
      try { await db.exec("ALTER TABLE projects ADD COLUMN priority TEXT DEFAULT 'Medium'"); } catch (e) { console.error(e.message); }
    }

    if (!columns.includes('deadline')) {
      console.log('Adding deadline column to projects...');
      try { await db.exec("ALTER TABLE projects ADD COLUMN deadline TEXT"); } catch (e) { console.error(e.message); }
    }
    
    if (!columns.includes('tags')) {
      console.log('Adding tags column to projects...');
      try { await db.exec("ALTER TABLE projects ADD COLUMN tags TEXT"); } catch (e) { console.error(e.message); }
    }
  }

  const taskTableInfo = await db.all("PRAGMA table_info(tasks)");
  const taskColumns = taskTableInfo.map(c => c.name);
  if (taskColumns.length > 0) {
    if (!taskColumns.includes('assignee_id')) {
      console.log('Adding assignee_id column to tasks...');
      try { await db.exec("ALTER TABLE tasks ADD COLUMN assignee_id INTEGER"); } catch (e) { console.error(e.message); }
    }
    if (!taskColumns.includes('priority')) {
      console.log('Adding priority column to tasks...');
      try { await db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Medium'"); } catch (e) { console.error(e.message); }
    }
    if (!taskColumns.includes('position')) {
      console.log('Adding position column to tasks...');
      try { await db.exec("ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0"); } catch (e) { console.error(e.message); }
    }
    if (!taskColumns.includes('updated_at')) {
      console.log('Adding updated_at column to tasks...');
      try { 
        await db.exec("ALTER TABLE tasks ADD COLUMN updated_at DATETIME"); 
        await db.exec("UPDATE tasks SET updated_at = created_at");
      } catch (e) { console.error(e.message); }
    }
  }

  // Also check if status needs a default change or if it exists
  if (columns.length > 0 && !columns.includes('status')) {
     try { await db.exec("ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'In Progress'"); } catch (e) { console.error(e.message); }
  }

  console.log('Migration complete.');
  await db.close();
}

migrate().catch(console.error);
