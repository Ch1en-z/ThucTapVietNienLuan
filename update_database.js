const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Kết nối database
const db = new sqlite3.Database('voting.db');

console.log('Đang cập nhật cấu trúc database...');

db.serialize(() => {
    // Kiểm tra và thêm cột deleted_at vào bảng categories nếu chưa có
    db.run(`ALTER TABLE categories ADD COLUMN deleted_at DATETIME DEFAULT NULL`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Lỗi khi thêm cột deleted_at vào categories:', err.message);
        } else {
            console.log('✓ Đã thêm cột deleted_at vào bảng categories');
        }
    });

    // Kiểm tra và thêm cột end_time vào bảng categories nếu chưa có
    db.run(`ALTER TABLE categories ADD COLUMN end_time DATETIME DEFAULT NULL`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Lỗi khi thêm cột end_time vào categories:', err.message);
        } else {
            console.log('✓ Đã thêm cột end_time vào bảng categories');
        }
    });

    // Kiểm tra và thêm cột deleted_at vào bảng nominations nếu chưa có
    db.run(`ALTER TABLE nominations ADD COLUMN deleted_at DATETIME DEFAULT NULL`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Lỗi khi thêm cột deleted_at vào nominations:', err.message);
        } else {
            console.log('✓ Đã thêm cột deleted_at vào bảng nominations');
        }
    });

    // Kiểm tra và thêm cột end_time vào bảng nominations nếu chưa có
    db.run(`ALTER TABLE nominations ADD COLUMN end_time DATETIME DEFAULT NULL`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Lỗi khi thêm cột end_time vào nominations:', err.message);
        } else {
            console.log('✓ Đã thêm cột end_time vào bảng nominations');
        }
    });

    // Kiểm tra và thêm cột created_at vào bảng categories nếu chưa có
    db.run(`ALTER TABLE categories ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Lỗi khi thêm cột created_at vào categories:', err.message);
        } else {
            console.log('✓ Đã thêm cột created_at vào bảng categories');
        }
    });

    // Kiểm tra và thêm cột created_at vào bảng nominations nếu chưa có
    db.run(`ALTER TABLE nominations ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Lỗi khi thêm cột created_at vào nominations:', err.message);
        } else {
            console.log('✓ Đã thêm cột created_at vào bảng nominations');
        }
    });

    // Hiển thị cấu trúc bảng sau khi cập nhật
    setTimeout(() => {
        console.log('\n=== Cấu trúc bảng categories ===');
        db.all("PRAGMA table_info(categories)", (err, rows) => {
            if (err) {
                console.error('Lỗi khi lấy thông tin bảng categories:', err);
            } else {
                rows.forEach(row => {
                    console.log(`${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
                });
            }
        });

        console.log('\n=== Cấu trúc bảng nominations ===');
        db.all("PRAGMA table_info(nominations)", (err, rows) => {
            if (err) {
                console.error('Lỗi khi lấy thông tin bảng nominations:', err);
            } else {
                rows.forEach(row => {
                    console.log(`${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
                });
            }
            
            // Đóng database sau khi hoàn thành
            setTimeout(() => {
                db.close();
                console.log('\n✓ Cập nhật database hoàn tất!');
            }, 1000);
        });
    }, 2000);
});
