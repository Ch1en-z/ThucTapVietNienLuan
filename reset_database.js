const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Xóa file database cũ nếu tồn tại
if (fs.existsSync('voting.db')) {
    fs.unlinkSync('voting.db');
    console.log('Đã xóa database cũ');
}

// Tạo database mới
const db = new sqlite3.Database('voting.db');
console.log('Đang tạo database mới...');

db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Lỗi tạo bảng users:', err);
        else console.log('✓ Đã tạo bảng users');
    });

    // Categories table
    db.run(`CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        end_time DATETIME,
        status TEXT DEFAULT 'active',
        deleted_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Lỗi tạo bảng categories:', err);
        else console.log('✓ Đã tạo bảng categories');
    });

    // Nominations table
    db.run(`CREATE TABLE nominations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        image_url TEXT,
        deleted_at DATETIME DEFAULT NULL,
        end_time DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Lỗi tạo bảng nominations:', err);
        else console.log('✓ Đã tạo bảng nominations');
    });

    // Votes table
    db.run(`CREATE TABLE votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        nomination_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (nomination_id) REFERENCES nominations (id),
        UNIQUE(user_id, nomination_id)
    )`, (err) => {
        if (err) console.error('Lỗi tạo bảng votes:', err);
        else console.log('✓ Đã tạo bảng votes');
    });

    // Suggestions table
    db.run(`CREATE TABLE suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) console.error('Lỗi tạo bảng suggestions:', err);
        else console.log('✓ Đã tạo bảng suggestions');
    });

    // Thêm dữ liệu mẫu
    setTimeout(() => {
        // Insert default admin user
        const adminPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`, 
            ['admin', adminPassword, 'admin@example.com', 'admin'], (err) => {
            if (err) console.error('Lỗi thêm admin:', err);
            else console.log('✓ Đã thêm user admin');
        });

        // Insert default test user
        const userPassword = bcrypt.hashSync('user123', 10);
        db.run(`INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`, 
            ['user', userPassword, 'user@example.com', 'user'], (err) => {
            if (err) console.error('Lỗi thêm user:', err);
            else console.log('✓ Đã thêm user test');
        });

        // Thêm một số categories mẫu
        const sampleCategories = [
            ['Nhạc', null],
            ['Phim', null],
            ['Sách', null]
        ];

        sampleCategories.forEach(([name, endTime]) => {
            db.run(`INSERT INTO categories (name, end_time) VALUES (?, ?)`, 
                [name, endTime], (err) => {
                if (err) console.error(`Lỗi thêm category ${name}:`, err);
                else console.log(`✓ Đã thêm category: ${name}`);
            });
        });

        setTimeout(() => {
            console.log('\n=== Database đã được tạo thành công! ===');
            console.log('Thông tin đăng nhập:');
            console.log('- Admin: admin / admin123');
            console.log('- User: user / user123');
            db.close();
        }, 2000);
    }, 1000);
});
