const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

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
