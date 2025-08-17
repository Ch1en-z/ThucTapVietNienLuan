const sqlite3 = require('sqlite3').verbose();

// Kết nối database
const db = new sqlite3.Database('voting.db');

console.log('=== Kiểm tra dữ liệu database ===\n');

// Kiểm tra bảng categories
console.log('=== Bảng categories ===');
db.all("SELECT * FROM categories", (err, rows) => {
    if (err) {
        console.error('Lỗi khi truy vấn categories:', err);
    } else {
        console.log(`Tổng số categories: ${rows.length}`);
        rows.forEach((row, index) => {
            console.log(`${index + 1}. ID: ${row.id}, Name: ${row.name}, End Time: ${row.end_time}, Deleted: ${row.deleted_at}`);
        });
    }
    
    // Kiểm tra bảng nominations
    console.log('\n=== Bảng nominations ===');
    db.all("SELECT * FROM nominations", (err, rows) => {
        if (err) {
            console.error('Lỗi khi truy vấn nominations:', err);
        } else {
            console.log(`Tổng số nominations: ${rows.length}`);
            rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Name: ${row.name}, Category: ${row.category}, Deleted: ${row.deleted_at}`);
            });
        }
        
        // Kiểm tra bảng users
        console.log('\n=== Bảng users ===');
        db.all("SELECT id, username, email, role FROM users", (err, rows) => {
            if (err) {
                console.error('Lỗi khi truy vấn users:', err);
            } else {
                console.log(`Tổng số users: ${rows.length}`);
                rows.forEach((row, index) => {
                    console.log(`${index + 1}. ID: ${row.id}, Username: ${row.username}, Email: ${row.email}, Role: ${row.role}`);
                });
            }
            
            // Đóng database
            db.close();
            console.log('\n=== Kiểm tra hoàn tất ===');
        });
    });
});
