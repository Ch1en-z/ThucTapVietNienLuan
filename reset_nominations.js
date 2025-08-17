const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('voting.db');

console.log('=== Reset tất cả đề cử ===\n');

// Xóa tất cả đề cử
db.run("DELETE FROM nominations", function(err) {
    if (err) {
        console.error('Lỗi khi xóa đề cử:', err);
    } else {
        console.log(`✓ Đã xóa ${this.changes} đề cử`);
    }
    
    // Xóa tất cả votes
    db.run("DELETE FROM votes", function(err) {
        if (err) {
            console.error('Lỗi khi xóa votes:', err);
        } else {
            console.log(`✓ Đã xóa ${this.changes} votes`);
        }
        
        // Kiểm tra lại
        db.get("SELECT COUNT(*) as count FROM nominations", (err, row) => {
            if (err) {
                console.error('Lỗi khi kiểm tra:', err);
            } else {
                console.log(`\nSố đề cử còn lại: ${row.count}`);
            }
            
            db.close();
            console.log('\n=== Reset hoàn tất ===');
            console.log('Bây giờ bạn có thể thêm đề cử mới từ trang chủ!');
        });
    });
});
