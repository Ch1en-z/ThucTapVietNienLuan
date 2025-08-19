const Database = require('./database');
const path = require('path');

async function backupDatabase() {
    console.log('🔄 Starting database backup...');
    
    try {
        const db = new Database();
        await db.connect();
        
        const backupFile = await db.backup();
        console.log(`✅ Backup completed successfully!`);
        console.log(`📁 Backup file: ${backupFile}`);
        
        // Get file size
        const fs = require('fs');
        const stats = fs.statSync(backupFile);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📊 File size: ${fileSizeInMB} MB`);
        
        // Get database stats
        const dbStats = await db.getStats();
        console.log('\n📈 Database Statistics:');
        console.log(`- Active Users: ${dbStats.activeUsers}`);
        console.log(`- Active Categories: ${dbStats.activeCategories}`);
        console.log(`- Active Nominations: ${dbStats.activeNominations}`);
        console.log(`- Total Votes: ${dbStats.totalVotes}`);
        console.log(`- Pending Suggestions: ${dbStats.pendingSuggestions}`);
        
        await db.close();
        console.log('\n🎉 Backup process completed!');
        
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
    }
}

// Run backup
backupDatabase();
