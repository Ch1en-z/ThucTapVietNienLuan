const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'voting.db');
        this.backupPath = path.join(__dirname, 'backups');
        this.initializeBackupDirectory();
    }

    // Khởi tạo thư mục backup
    initializeBackupDirectory() {
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
    }

    // Kết nối database
    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables()
                        .then(() => this.insertDefaultData())
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    // Tạo các bảng
    createTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Users table
                this.db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    role TEXT DEFAULT 'user',
                    is_active BOOLEAN DEFAULT 1,
                    last_login DATETIME,
                    login_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Categories table
                this.db.run(`CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    end_time DATETIME,
                    status TEXT DEFAULT 'active',
                    max_nominations INTEGER DEFAULT 10,
                    deleted_at DATETIME DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Nominations table
                this.db.run(`CREATE TABLE IF NOT EXISTS nominations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT NOT NULL,
                    image_url TEXT,
                    is_approved BOOLEAN DEFAULT 1,
                    created_by INTEGER,
                    deleted_at DATETIME DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )`);

                // Votes table
                this.db.run(`CREATE TABLE IF NOT EXISTS votes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    nomination_id INTEGER NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (nomination_id) REFERENCES nominations (id) ON DELETE CASCADE,
                    UNIQUE(user_id, nomination_id)
                )`);

                // Suggestions table
                this.db.run(`CREATE TABLE IF NOT EXISTS suggestions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'normal',
                    assigned_to INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (assigned_to) REFERENCES users (id)
                )`);

                // Activity logs table
                this.db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT NOT NULL,
                    table_name TEXT,
                    record_id INTEGER,
                    old_values TEXT,
                    new_values TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )`);

                // System settings table
                this.db.run(`CREATE TABLE IF NOT EXISTS system_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    setting_key TEXT UNIQUE NOT NULL,
                    setting_value TEXT,
                    description TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                resolve();
            });
        });
    }

    // Thêm dữ liệu mặc định
    insertDefaultData() {
        return new Promise((resolve, reject) => {
            const bcrypt = require('bcryptjs');
            
            this.db.serialize(() => {
                // Insert default admin user
                const adminPassword = bcrypt.hashSync('admin123', 10);
                this.db.run(`INSERT OR IGNORE INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`, 
                    ['admin', adminPassword, 'admin@example.com', 'admin']);

                // Insert default test user
                const userPassword = bcrypt.hashSync('user123', 10);
                this.db.run(`INSERT OR IGNORE INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`, 
                    ['user', userPassword, 'user@example.com', 'user']);

                // Insert default categories
                const defaultCategories = [
                    'Công nghệ thông tin',
                    'Điện - Điện tử và Công nghệ vật liệu',
                    'Hóa học',
                    'Sinh học',
                    'Địa lý - Địa chất',
                    'Lý luận chính trị',
                    'Báo chí - Truyền thông',
                    'Môi trường',
                    'Kiến trúc'
                ];

                defaultCategories.forEach(category => {
                    this.db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [category]);
                });

                // Insert sample categories with different end times
                const sampleCategories = [
                    ['Công nghệ thông tin', '2024-12-31 23:59:59'],
                    ['Điện - Điện tử và Công nghệ vật liệu', '2024-12-25 23:59:59'],
                    ['Hóa học', '2024-12-28 23:59:59'],
                    ['Sinh học', '2024-12-30 23:59:59'],
                    ['Địa lý - Địa chất', '2024-12-27 23:59:59'],
                    ['Lý luận chính trị', '2024-12-26 23:59:59'],
                    ['Báo chí - Truyền thông', '2024-12-29 23:59:59'],
                    ['Môi trường', '2024-12-31 23:59:59'],
                    ['Kiến trúc', '2024-12-24 23:59:59']
                ];

                sampleCategories.forEach(cat => {
                    this.db.run(`INSERT OR IGNORE INTO categories (name, end_time) VALUES (?, ?)`, cat);
                });

                // Insert sample nominations
                const sampleNominations = [
                    ['Nguyễn Văn A', 'Mô tả về ứng viên A', 'Công nghệ thông tin', '/images/nominee1.jpg'],
                    ['Trần Thị B', 'Mô tả về ứng viên B', 'Điện - Điện tử và Công nghệ vật liệu', '/images/nominee2.jpg'],
                    ['Lê Văn C', 'Mô tả về ứng viên C', 'Hóa học', '/images/nominee3.jpg'],
                    ['Phạm Thị D', 'Mô tả về ứng viên D', 'Sinh học', '/images/nominee4.jpg'],
                    ['Hoàng Văn E', 'Mô tả về ứng viên E', 'Địa lý - Địa chất', '/images/nominee5.jpg'],
                    ['Vũ Thị F', 'Mô tả về ứng viên F', 'Lý luận chính trị', '/images/nominee6.jpg'],
                    ['Đặng Văn G', 'Mô tả về ứng viên G', 'Báo chí - Truyền thông', '/images/nominee7.jpg'],
                    ['Ngô Thị H', 'Mô tả về ứng viên H', 'Môi trường', '/images/nominee8.jpg'],
                    ['Bùi Văn I', 'Mô tả về ứng viên I', 'Kiến trúc', '/images/nominee9.jpg']
                ];

                sampleNominations.forEach(nom => {
                    this.db.get('SELECT COUNT(*) as count FROM nominations WHERE name = ? AND category = ?', 
                        [nom[0], nom[2]], (err, row) => {
                        if (err) {
                            console.error('Error checking nomination:', err);
                            return;
                        }
                        
                        if (row.count === 0) {
                            this.db.run(`INSERT INTO nominations (name, description, category, image_url) VALUES (?, ?, ?, ?)`, nom, function(err) {
                                if (err) {
                                    console.error('Error inserting sample nomination:', err);
                                } else {
                                    console.log(`Added sample nomination: ${nom[0]} in ${nom[2]}`);
                                }
                            });
                        }
                    });
                });

                // Insert system settings
                const defaultSettings = [
                    ['max_votes_per_user', '1', 'Số lượng vote tối đa mỗi user cho một nomination'],
                    ['voting_enabled', 'true', 'Bật/tắt tính năng voting'],
                    ['registration_enabled', 'true', 'Bật/tắt tính năng đăng ký'],
                    ['maintenance_mode', 'false', 'Chế độ bảo trì'],
                    ['session_timeout', '3600', 'Thời gian timeout session (giây)'],
                    ['max_login_attempts', '5', 'Số lần đăng nhập tối đa'],
                    ['backup_interval', '86400', 'Thời gian backup tự động (giây)']
                ];

                defaultSettings.forEach(setting => {
                    this.db.run(`INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)`, setting);
                });

                resolve();
            });
        });
    }

    // Backup database
    backup() {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupPath, `voting_backup_${timestamp}.db`);
            
            this.db.backup(backupFile, (err) => {
                if (err) {
                    console.error('Backup failed:', err);
                    reject(err);
                } else {
                    console.log(`Database backed up to: ${backupFile}`);
                    resolve(backupFile);
                }
            });
        });
    }

    // Log activity
    logActivity(userId, action, tableName, recordId, oldValues = null, newValues = null, req = null) {
        return new Promise((resolve, reject) => {
            const ipAddress = req ? req.ip || req.connection.remoteAddress : null;
            const userAgent = req ? req.get('User-Agent') : null;
            
            this.db.run(
                'INSERT INTO activity_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent],
                function(err) {
                    if (err) {
                        console.error('Error logging activity:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    // Get system setting
    getSetting(key) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.setting_value : null);
                }
            });
        });
    }

    // Set system setting
    setSetting(key, value) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime("now"))',
                [key, value],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    // Get database statistics
    getStats() {
        return new Promise((resolve, reject) => {
            const stats = {};
            
            const queries = [
                'SELECT COUNT(*) as count FROM users WHERE is_active = 1',
                'SELECT COUNT(*) as count FROM categories WHERE deleted_at IS NULL',
                'SELECT COUNT(*) as count FROM nominations WHERE deleted_at IS NULL',
                'SELECT COUNT(*) as count FROM votes',
                'SELECT COUNT(*) as count FROM suggestions WHERE status = "pending"'
            ];

            Promise.all(queries.map(query => {
                return new Promise((resolveQuery, rejectQuery) => {
                    this.db.get(query, (err, row) => {
                        if (err) {
                            rejectQuery(err);
                        } else {
                            resolveQuery(row.count);
                        }
                    });
                });
            })).then(results => {
                stats.activeUsers = results[0];
                stats.activeCategories = results[1];
                stats.activeNominations = results[2];
                stats.totalVotes = results[3];
                stats.pendingSuggestions = results[4];
                resolve(stats);
            }).catch(reject);
        });
    }

    // Close database connection
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;
