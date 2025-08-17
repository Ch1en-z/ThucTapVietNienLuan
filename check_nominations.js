const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('voting.db');

console.log('=== Kiểm tra trạng thái đề cử ===\n');

// Kiểm tra tất cả đề cử
db.all("SELECT id, name, category, deleted_at FROM nominations ORDER BY id", (err, rows) => {
    if (err) {
        console.error('Lỗi khi truy vấn nominations:', err);
    } else {
        console.log(`Tổng số đề cử: ${rows.length}`);
        console.log('\nChi tiết từng đề cử:');
        rows.forEach((row, index) => {
            const status = row.deleted_at ? 'ĐÃ XÓA' : 'HOẠT ĐỘNG';
            console.log(`${index + 1}. ID: ${row.id}, Tên: ${row.name}, Danh mục: ${row.category}, Trạng thái: ${status}, Deleted_at: ${row.deleted_at}`);
        });
    }
    
    // Kiểm tra đề cử đã xóa
    console.log('\n=== Đề cử đã xóa ===');
    db.all("SELECT id, name, category, deleted_at FROM nominations WHERE deleted_at IS NOT NULL", (err, rows) => {
        if (err) {
            console.error('Lỗi khi truy vấn nominations đã xóa:', err);
        } else {
            console.log(`Số đề cử đã xóa: ${rows.length}`);
            rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Tên: ${row.name}, Danh mục: ${row.category}, Thời gian xóa: ${row.deleted_at}`);
            });
        }
        
        // Kiểm tra đề cử còn hoạt động
        console.log('\n=== Đề cử còn hoạt động ===');
        db.all("SELECT id, name, category FROM nominations WHERE deleted_at IS NULL", (err, rows) => {
            if (err) {
                console.error('Lỗi khi truy vấn nominations hoạt động:', err);
            } else {
                console.log(`Số đề cử còn hoạt động: ${rows.length}`);
                rows.forEach((row, index) => {
                    console.log(`${index + 1}. ID: ${row.id}, Tên: ${row.name}, Danh mục: ${row.category}`);
                });
            }
            
            db.close();
        });
    });
});
