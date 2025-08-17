const sqlite3 = require('sqlite3').verbose();

// Connect to database
const db = new sqlite3.Database('voting.db');

console.log('=== Dọn dẹp đề cử trùng lặp ===\n');

// Find duplicate nominations (same name and category)
const findDuplicatesQuery = `
    SELECT name, category, COUNT(*) as count, 
           GROUP_CONCAT(id) as ids,
           GROUP_CONCAT(deleted_at) as deleted_ats
    FROM nominations 
    GROUP BY name, category 
    HAVING COUNT(*) > 1
    ORDER BY name, category
`;

db.all(findDuplicatesQuery, (err, duplicates) => {
    if (err) {
        console.error('Error finding duplicates:', err);
        db.close();
        return;
    }

    if (duplicates.length === 0) {
        console.log('Không có đề cử trùng lặp nào.');
        db.close();
        return;
    }

    console.log(`Tìm thấy ${duplicates.length} nhóm đề cử trùng lặp:\n`);

    duplicates.forEach((duplicate, index) => {
        console.log(`${index + 1}. "${duplicate.name}" trong danh mục "${duplicate.category}"`);
        console.log(`   Số lượng: ${duplicate.count}`);
        console.log(`   IDs: ${duplicate.ids}`);
        console.log(`   Deleted_at: ${duplicate.deleted_ats}`);
        console.log('');

        // For each duplicate group, keep only one active nomination
        const ids = duplicate.ids.split(',').map(id => parseInt(id));
        
        // Find which ones are active (not deleted)
        const activeIds = [];
        const deletedIds = [];
        
        ids.forEach(id => {
            db.get('SELECT deleted_at FROM nominations WHERE id = ?', [id], (err, row) => {
                if (err) {
                    console.error(`Error checking nomination ${id}:`, err);
                    return;
                }
                
                if (row.deleted_at === null) {
                    activeIds.push(id);
                } else {
                    deletedIds.push(id);
                }
                
                // If this is the last ID in the group, process the duplicates
                if (activeIds.length + deletedIds.length === ids.length) {
                    processDuplicates(duplicate.name, duplicate.category, activeIds, deletedIds);
                }
            });
        });
    });
});

function processDuplicates(name, category, activeIds, deletedIds) {
    console.log(`Xử lý trùng lặp cho "${name}" trong "${category}":`);
    console.log(`   Active IDs: ${activeIds.join(', ')}`);
    console.log(`   Deleted IDs: ${deletedIds.join(', ')}`);
    
    if (activeIds.length > 1) {
        // Keep only the first active nomination, delete the rest
        const keepId = activeIds[0];
        const deleteIds = activeIds.slice(1);
        
        console.log(`   Giữ lại ID ${keepId}, xóa ${deleteIds.length} đề cử active khác`);
        
        deleteIds.forEach(id => {
            db.run('UPDATE nominations SET deleted_at = datetime("now") WHERE id = ?', [id], function(err) {
                if (err) {
                    console.error(`Error deleting duplicate nomination ${id}:`, err);
                } else {
                    console.log(`   Đã xóa đề cử ID ${id}`);
                }
            });
        });
    } else if (activeIds.length === 0 && deletedIds.length > 1) {
        // All are deleted, keep only the most recently deleted one
        const keepId = deletedIds[0];
        const deleteIds = deletedIds.slice(1);
        
        console.log(`   Tất cả đều đã bị xóa, giữ lại ID ${keepId}, xóa ${deleteIds.length} đề cử khác`);
        
        deleteIds.forEach(id => {
            db.run('DELETE FROM nominations WHERE id = ?', [id], function(err) {
                if (err) {
                    console.error(`Error permanently deleting nomination ${id}:`, err);
                } else {
                    console.log(`   Đã xóa vĩnh viễn đề cử ID ${id}`);
                }
            });
        });
    }
    
    console.log('');
}

// Close database after a delay to allow all queries to complete
setTimeout(() => {
    console.log('Hoàn thành dọn dẹp đề cử trùng lặp.');
    db.close();
}, 3000);
