const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'protrack.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT * FROM projects WHERE title LIKE '%Farmacia%' OR title LIKE '%Call%'", [], (err, rows) => {
    if (err) console.error(err);
    console.log('--- TARGET PROJECTS ---');
    console.log(JSON.stringify(rows, null, 2));
    
    if (rows.length > 0) {
      const pIds = rows.map(r => r.id).join(',');
      db.all(`SELECT * FROM tasks WHERE project_id IN (${pIds})`, [], (err, tRows) => {
        if (err) console.error(err);
        console.log('\n--- TASKS FOR THESE PROJECTS ---');
        console.log(JSON.stringify(tRows, null, 2));
        
        db.all(`SELECT * FROM project_members WHERE project_id IN (${pIds})`, [], (err, mRows) => {
          if (err) console.error(err);
          console.log('\n--- MEMBERS FOR THESE PROJECTS ---');
          console.log(JSON.stringify(mRows, null, 2));
          db.close();
        });
      });
    } else {
      console.log('No projects found with that name.');
      db.close();
    }
  });
});
