const sqlite3 = require('sqlite3').verbose();

// Connect to database
const db = new sqlite3.Database('voting.db');

console.log('=== Kiểm tra trạng thái bình chọn ===\n');

// Check current time
const now = new Date();
console.log(`Thời gian hiện tại: ${now.toLocaleString('vi-VN')}\n`);

// Check categories with end times
const checkCategoriesQuery = `
    SELECT id, name, end_time, 
           CASE 
               WHEN end_time IS NULL THEN 'active'
               WHEN datetime('now') < end_time THEN 'active'
               ELSE 'expired'
           END as current_status
    FROM categories 
    WHERE deleted_at IS NULL AND end_time IS NOT NULL
    ORDER BY end_time
`;

db.all(checkCategoriesQuery, (err, categories) => {
    if (err) {
        console.error('Lỗi khi kiểm tra categories:', err);
        db.close();
        return;
    }

    if (categories.length === 0) {
        console.log('Không có danh mục nào có thời gian kết thúc.');
        db.close();
        return;
    }

    console.log(`Tìm thấy ${categories.length} danh mục có thời gian kết thúc:\n`);

    let expiredCount = 0;
    let activeCount = 0;

    categories.forEach((category, index) => {
        const endTime = new Date(category.end_time);
        const isExpired = endTime < now;
        const timeDiff = Math.abs(endTime - now);
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        console.log(`${index + 1}. ${category.name}`);
        console.log(`   Thời gian kết thúc: ${endTime.toLocaleString('vi-VN')}`);
        console.log(`   Trạng thái hiện tại: ${category.current_status}`);
        
        if (isExpired) {
            console.log(`   ❌ ĐÃ HẾT HẠN (${hoursDiff} giờ ${minutesDiff} phút trước)`);
            expiredCount++;
        } else {
            console.log(`   ✅ Còn ${hoursDiff} giờ ${minutesDiff} phút`);
            activeCount++;
        }
        console.log('');
    });

    console.log(`=== Tổng kết ===`);
    console.log(`Cuộc bình chọn đang diễn ra: ${activeCount}`);
    console.log(`Cuộc bình chọn đã kết thúc: ${expiredCount}`);
    console.log(`Tổng số: ${categories.length}`);

    // Check if there are any nominations that need status update
    if (expiredCount > 0) {
        console.log('\n=== Kiểm tra đề cử cần cập nhật trạng thái ===');
        
        const checkNominationsQuery = `
            SELECT n.id, n.name, n.category, c.end_time,
                   CASE 
                       WHEN c.end_time IS NULL THEN 'active'
                       WHEN datetime('now') < c.end_time THEN 'active'
                       ELSE 'expired'
                   END as should_be_status
            FROM nominations n
            LEFT JOIN categories c ON n.category = c.name
            WHERE n.deleted_at IS NULL AND c.deleted_at IS NULL 
                  AND c.end_time IS NOT NULL
                  AND datetime('now') >= c.end_time
        `;

        db.all(checkNominationsQuery, (err, nominations) => {
            if (err) {
                console.error('Lỗi khi kiểm tra nominations:', err);
                db.close();
                return;
            }

            if (nominations.length === 0) {
                console.log('Tất cả đề cử đã có trạng thái đúng.');
            } else {
                console.log(`Tìm thấy ${nominations.length} đề cử cần cập nhật trạng thái:`);
                nominations.forEach(nom => {
                    console.log(`- ${nom.name} (${nom.category}): ID ${nom.id}`);
                });
                console.log('\nLưu ý: Trạng thái sẽ được cập nhật tự động khi truy cập trang web.');
            }
            
            db.close();
        });
    } else {
        db.close();
    }
});
