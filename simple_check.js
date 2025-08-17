const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('voting.db');

console.log('Checking database...');

db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Categories count:', row.count);
    }
    
    db.get("SELECT COUNT(*) as count FROM nominations", (err, row) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Nominations count:', row.count);
        }
        
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (err) {
                console.error('Error:', err);
            } else {
                console.log('Users count:', row.count);
            }
            
            db.close();
        });
    });
});
