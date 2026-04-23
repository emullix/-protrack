import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'protrack.db');
const db = new sqlite3.default.Database(dbPath);

console.log('--- PROJECTS ---');
db.all('SELECT * FROM projects', [], (err, rows) => {
  if (err) throw err;
  console.log(JSON.stringify(rows, null, 2));
  
  console.log('\n--- TASKS ---');
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) throw err;
    console.log(JSON.stringify(rows, null, 2));
    
    console.log('\n--- PROJECT MEMBERS ---');
    db.all('SELECT * FROM project_members', [], (err, rows) => {
      if (err) throw err;
      console.log(JSON.stringify(rows, null, 2));
      db.close();
    });
  });
});
