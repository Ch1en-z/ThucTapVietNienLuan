const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('voting.db');

console.log('=== Dọn dẹp database đề cử ===\n');

// Xóa tất cả đề cử cũ (có tên trùng lặp)
db.run(`DELETE FROM nominations WHERE name IN (
    'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 
    'Hoàng Văn E', 'Vũ Thị F', 'Đặng Văn G', 'Ngô Thị H', 'Bùi Văn I'
)`, function(err) {
    if (err) {
        console.error('Lỗi khi xóa đề cử cũ:', err);
    } else {
        console.log(`✓ Đã xóa ${this.changes} đề cử cũ`);
    }
    
    // Kiểm tra lại sau khi xóa
    db.all("SELECT id, name, category, deleted_at FROM nominations ORDER BY id", (err, rows) => {
        if (err) {
            console.error('Lỗi khi kiểm tra sau khi xóa:', err);
        } else {
            console.log(`\nSố đề cử còn lại: ${rows.length}`);
            console.log('\nDanh sách đề cử còn lại:');
            rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Tên: ${row.name}, Danh mục: ${row.category}`);
            });
        }
        
        db.close();
        console.log('\n=== Dọn dẹp hoàn tất ===');
    });
});
