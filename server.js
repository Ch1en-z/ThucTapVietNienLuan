const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
let db = null;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// EJS Layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(flash());

// Initialize database
async function startServer() {
    try {
        db = new Database();
        await db.connect();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server initialization
startServer();

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Middleware to make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.messages = req.flash();
    next();
});

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Access denied. Admin only.');
    }
}

// Routes
app.get('/', (req, res) => {
    // Get all active categories first
    const categoriesQuery = `
        SELECT c.name, c.end_time,
               CASE 
                   WHEN c.end_time IS NULL THEN 'active'
                   WHEN datetime('now') < c.end_time THEN 'active'
                   ELSE 'expired'
               END as voting_status,
               COUNT(n.id) as nomination_count
        FROM categories c
        LEFT JOIN nominations n ON c.name = n.category AND n.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.name, c.end_time, c.status, c.deleted_at, c.created_at
        ORDER BY c.name
    `;
    
    // Get all active nominations
    const nominationsQuery = `
        SELECT n.*, 
               c.end_time,
               CASE 
                   WHEN c.end_time IS NULL THEN 'active'
                   WHEN datetime('now') < c.end_time THEN 'active'
                   ELSE 'expired'
               END as voting_status
        FROM nominations n
        LEFT JOIN categories c ON n.category = c.name
        WHERE n.deleted_at IS NULL AND c.deleted_at IS NULL
        ORDER BY n.category, n.name
    `;
    
    db.db.all(categoriesQuery, (err, categories) => {
        if (err) {
            console.error(err);
            categories = [];
        }
        
        console.log('Categories found:', categories.length);
        categories.forEach(cat => {
            console.log(`- ${cat.name}: ${cat.nomination_count} nominations`);
        });
        
        db.db.all(nominationsQuery, (err, nominations) => {
            if (err) {
                console.error(err);
                nominations = [];
            }
            
            console.log('Nominations found:', nominations.length);
            
            res.render('index', { categories, nominations });
        });
    });
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            req.flash('error', 'Database error');
            return res.redirect('/login');
        }
        
        if (!user || !bcrypt.compareSync(password, user.password)) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');
        }
        
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        
        res.redirect('/');
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register');
});

app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    
    if (!username || !password || !email) {
        req.flash('error', 'All fields are required');
        return res.redirect('/register');
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', 
        [username, hashedPassword, email], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                req.flash('error', 'Username or email already exists');
            } else {
                req.flash('error', 'Registration failed');
            }
            return res.redirect('/register');
        }
        
        req.flash('success', 'Registration successful! Please login.');
        res.redirect('/login');
    });
});

app.post('/vote', requireAuth, (req, res) => {
    const { nominationId } = req.body;
    const userId = req.session.user.id;
    
    // Check if voting is still active for this nomination's category
    const query = `
        SELECT c.end_time, c.name as category_name
        FROM nominations n
        LEFT JOIN categories c ON n.category = c.name
        WHERE n.id = ?
    `;
    
    db.db.get(query, [nominationId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!result) {
            return res.status(404).json({ error: 'Nomination not found' });
        }
        
        // Check if voting has expired for this category
        if (result.end_time && new Date() > new Date(result.end_time)) {
            return res.status(400).json({ 
                error: `Cuộc bình chọn cho lĩnh vực "${result.category_name}" đã kết thúc` 
            });
        }
        
        // Proceed with voting
        db.db.run('INSERT OR REPLACE INTO votes (user_id, nomination_id) VALUES (?, ?)', 
            [userId, nominationId], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Voting failed' });
            }
            
            res.json({ success: true, message: 'Vote recorded successfully' });
        });
    });
});

// Route cho người dùng xem kết quả (không cần admin)
app.get('/results', (req, res) => {
    const query = `
        SELECT n.*, COUNT(v.id) as vote_count,
               CASE 
                   WHEN n.end_time IS NULL THEN 'active'
                   WHEN datetime('now') < n.end_time THEN 'active'
                   ELSE 'expired'
               END as voting_status
        FROM nominations n
        LEFT JOIN votes v ON n.id = v.nomination_id
        WHERE n.deleted_at IS NULL
        GROUP BY n.id
        ORDER BY n.category, vote_count DESC
    `;
    
    db.db.all(query, (err, results) => {
        if (err) {
            console.error(err);
            results = [];
        }
        
        // Group by category
        const groupedResults = {};
        results.forEach(result => {
            if (!groupedResults[result.category]) {
                groupedResults[result.category] = [];
            }
            groupedResults[result.category].push(result);
        });
        
        res.render('results', { 
            results: groupedResults, 
            user: req.session.user 
        });
    });
});

// Route cho admin xem kết quả chi tiết (bao gồm thông tin người vote)
app.get('/admin/results', requireAdmin, (req, res) => {
    const query = `
        SELECT n.*, COUNT(v.id) as vote_count,
               CASE 
                   WHEN n.end_time IS NULL THEN 'active'
                   WHEN datetime('now') < n.end_time THEN 'active'
                   ELSE 'expired'
               END as voting_status
        FROM nominations n
        LEFT JOIN votes v ON n.id = v.nomination_id
        WHERE n.deleted_at IS NULL
        GROUP BY n.id
        ORDER BY n.category, vote_count DESC
    `;
    
    db.db.all(query, (err, results) => {
        if (err) {
            console.error(err);
            results = [];
        }
        
        // Group by category
        const groupedResults = {};
        results.forEach(result => {
            if (!groupedResults[result.category]) {
                groupedResults[result.category] = [];
            }
            groupedResults[result.category].push(result);
        });
        
        res.render('admin-results', { 
            results: groupedResults, 
            user: req.session.user 
        });
    });
});

app.get('/admin', requireAdmin, (req, res) => {
    res.render('admin', { user: req.session.user });
});

// API endpoint to get nominations for admin
app.get('/api/nominations', requireAdmin, (req, res) => {
    const query = `
        SELECT n.*, c.name as category_name
        FROM nominations n
        LEFT JOIN categories c ON n.category = c.name
        WHERE n.deleted_at IS NULL
        ORDER BY n.created_at DESC
    `;
    
    db.db.all(query, (err, nominations) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json(nominations);
    });
});

// Add nomination route (Admin only)
app.get('/add-nomination', requireAdmin, (req, res) => {
    // Get all active categories
    const query = `
        SELECT name 
        FROM categories 
        WHERE deleted_at IS NULL 
        ORDER BY name
    `;
    
    db.db.all(query, (err, categories) => {
        if (err) {
            console.error(err);
            categories = [];
        }
        
        res.render('add-nomination', { 
            user: req.session.user,
            categories: categories
        });
    });
});

app.post('/add-nomination', requireAdmin, (req, res) => {
    const { name, description, category } = req.body;
    
    if (!name || !description || !category) {
        req.flash('error', 'Tất cả các trường đều bắt buộc');
        return res.redirect('/add-nomination');
    }
    
    db.db.run('INSERT INTO nominations (name, description, category) VALUES (?, ?, ?)', 
        [name, description, category], function(err) {
        if (err) {
            req.flash('error', 'Thêm ứng viên thất bại');
            return res.redirect('/add-nomination');
        }
        
        req.flash('success', 'Thêm ứng viên thành công!');
        res.redirect('/admin');
    });
});

// Suggest nomination route (Users)
app.get('/suggest-nomination', requireAuth, (req, res) => {
    // Get all active categories
    const query = `
        SELECT name 
        FROM categories 
        WHERE deleted_at IS NULL 
        ORDER BY name
    `;
    
    db.db.all(query, (err, categories) => {
        if (err) {
            console.error(err);
            categories = [];
        }
        
        res.render('suggest-nomination', { 
            user: req.session.user,
            categories: categories
        });
    });
});

app.post('/suggest-nomination', requireAuth, (req, res) => {
    const { name, description, category } = req.body;
    const userId = req.session.user.id;
    
    if (!name || !description || !category) {
        req.flash('error', 'Tất cả các trường đều bắt buộc');
        return res.redirect('/suggest-nomination');
    }
    
    db.db.run('INSERT INTO suggestions (user_id, type, title, description) VALUES (?, ?, ?, ?)', 
        [userId, 'nomination', name, `${description} - Danh mục: ${category}`], function(err) {
        if (err) {
            req.flash('error', 'Gửi đề cử thất bại');
            return res.redirect('/suggest-nomination');
        }
        
        req.flash('success', 'Xin cảm ơn! Đề cử của bạn đã được gửi thành công.');
        res.redirect('/');
    });
});

// Feedback route (Users)
app.get('/feedback', requireAuth, (req, res) => {
    res.render('feedback', { user: req.session.user });
});

app.post('/feedback', requireAuth, (req, res) => {
    const { title, description } = req.body;
    const userId = req.session.user.id;
    
    if (!title || !description) {
        req.flash('error', 'Tất cả các trường đều bắt buộc');
        return res.redirect('/feedback');
    }
    
    db.db.run('INSERT INTO suggestions (user_id, type, title, description) VALUES (?, ?, ?, ?)', 
        [userId, 'feedback', title, description], function(err) {
        if (err) {
            req.flash('error', 'Gửi góp ý thất bại');
            return res.redirect('/feedback');
        }
        
        req.flash('success', 'Xin cảm ơn! Góp ý của bạn đã được gửi thành công.');
        res.redirect('/');
    });
});

// Manage categories route (Admin only)
app.get('/manage-categories', requireAdmin, (req, res) => {
    const query = `
        SELECT c.*, 
               COUNT(n.id) as nomination_count,
               CASE 
                   WHEN c.end_time IS NULL THEN 'active'
                   WHEN datetime('now') < c.end_time THEN 'active'
                   ELSE 'expired'
               END as voting_status
        FROM categories c
        LEFT JOIN nominations n ON c.name = n.category AND n.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.name, c.end_time, c.status, c.deleted_at, c.created_at
        ORDER BY c.name
    `;
    
    db.db.all(query, (err, categories) => {
        if (err) {
            console.error(err);
            categories = [];
        }
        
        res.render('manage-categories', { 
            categories, 
            user: req.session.user 
        });
    });
});

// Add new category route (Admin only)
app.post('/add-category', requireAdmin, (req, res) => {
    const { name, end_date, end_time } = req.body;
    
    if (!name) {
        return res.status(400).json({ success: false, error: 'Tên danh mục là bắt buộc' });
    }
    
    let endDateTime = null;
    if (end_date && end_time) {
        endDateTime = `${end_date} ${end_time}`;
    }
    
    db.db.run('INSERT INTO categories (name, end_time) VALUES (?, ?)', 
        [name, endDateTime], function(err) {
        if (err) {
            console.error(err);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ success: false, error: 'Danh mục này đã tồn tại' });
            }
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        console.log(`Category created successfully: ${name} (ID: ${this.lastID})`);
        res.json({ success: true, message: 'Danh mục đã được tạo thành công', categoryId: this.lastID });
    });
});

app.post('/update-category-end-time', requireAdmin, (req, res) => {
    const { categoryId, end_date, end_time } = req.body;
    
    if (!categoryId) {
        return res.status(400).json({ error: 'Category ID is required' });
    }
    
    let endDateTime = null;
    if (end_date && end_time) {
        endDateTime = `${end_date} ${end_time}`;
    }
    
    db.db.run('UPDATE categories SET end_time = ? WHERE id = ?', 
        [endDateTime, categoryId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Update failed' });
        }
        
        res.json({ success: true, message: 'Category end time updated successfully' });
    });
});

// View suggestions route (Admin only)
app.get('/suggestions', requireAdmin, (req, res) => {
    const suggestionsQuery = `
        SELECT s.*, u.username 
        FROM suggestions s 
        JOIN users u ON s.user_id = u.id 
        ORDER BY s.created_at DESC
    `;
    
    const categoriesQuery = `
        SELECT c.*, 
               COUNT(n.id) as nomination_count,
               CASE 
                   WHEN c.end_time IS NULL THEN 'active'
                   WHEN datetime('now') < c.end_time THEN 'active'
                   ELSE 'expired'
               END as voting_status
        FROM categories c
        LEFT JOIN nominations n ON c.name = n.category AND n.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.name, c.end_time, c.status, c.deleted_at, c.created_at
        ORDER BY c.name
    `;
    
    db.db.all(suggestionsQuery, (err, suggestions) => {
        if (err) {
            console.error(err);
            suggestions = [];
        }
        
        db.db.all(categoriesQuery, (err, categories) => {
            if (err) {
                console.error(err);
                categories = [];
            }
            
            res.render('suggestions', { 
                suggestions, 
                categories,
                user: req.session.user 
            });
        });
    });
});

// Process suggestion route (Admin only)
app.post('/suggestions/:id/process', requireAdmin, (req, res) => {
    const suggestionId = req.params.id;
    
    db.db.run('UPDATE suggestions SET status = ? WHERE id = ?', 
        ['processed', suggestionId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'Suggestion not found' });
        }
        
        res.json({ success: true, message: 'Suggestion marked as processed' });
    });
});

// Delete suggestion route (Admin only)
app.delete('/suggestions/:id/delete', requireAdmin, (req, res) => {
    const suggestionId = req.params.id;
    
    db.db.run('DELETE FROM suggestions WHERE id = ?', 
        [suggestionId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'Suggestion not found' });
        }
        
        res.json({ success: true, message: 'Suggestion deleted successfully' });
    });
});

// Soft delete category route (Admin only)
app.delete('/categories/:id/delete', requireAdmin, (req, res) => {
    const categoryId = req.params.id;
    
    db.db.run('UPDATE categories SET deleted_at = datetime("now") WHERE id = ?', 
        [categoryId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        
        res.json({ success: true, message: 'Category moved to trash successfully' });
    });
});

// Restore category route (Admin only)
app.post('/categories/:id/restore', requireAdmin, (req, res) => {
    const categoryId = req.params.id;
    
    db.db.run('UPDATE categories SET deleted_at = NULL WHERE id = ?', 
        [categoryId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        
        res.json({ success: true, message: 'Category restored successfully' });
    });
});

// Soft delete nomination route (Admin only)
app.delete('/nominations/:id/delete', requireAdmin, (req, res) => {
    const nominationId = req.params.id;
    
    db.db.run('UPDATE nominations SET deleted_at = datetime("now") WHERE id = ?', 
        [nominationId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'Nomination not found' });
        }
        
        res.json({ success: true, message: 'Nomination moved to trash successfully' });
    });
});

// Bulk delete nominations route (Admin only)
app.post('/nominations/bulk-delete', requireAdmin, (req, res) => {
    const { nominationIds } = req.body;
    
    if (!nominationIds || !Array.isArray(nominationIds) || nominationIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid nomination IDs' });
    }
    
    const placeholders = nominationIds.map(() => '?').join(',');
    const query = `UPDATE nominations SET deleted_at = datetime("now") WHERE id IN (${placeholders})`;
    
    db.db.run(query, nominationIds, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        res.json({ 
            success: true, 
            message: `${this.changes} nominations moved to trash successfully`,
            deletedCount: this.changes
        });
    });
});

// Restore nomination route (Admin only)
app.post('/nominations/:id/restore', requireAdmin, (req, res) => {
    const nominationId = req.params.id;
    
    db.db.run('UPDATE nominations SET deleted_at = NULL WHERE id = ?', 
        [nominationId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'Nomination not found' });
        }
        
        res.json({ success: true, message: 'Nomination restored successfully' });
    });
});

// Trash history route (Admin only)
app.get('/trash', requireAdmin, (req, res) => {
    // Get deleted categories
    const categoriesQuery = `
        SELECT c.*, 
               COUNT(n.id) as nomination_count
        FROM categories c
        LEFT JOIN nominations n ON c.name = n.category AND n.deleted_at IS NULL
        WHERE c.deleted_at IS NOT NULL
        GROUP BY c.id
        ORDER BY c.deleted_at DESC
    `;
    
    // Get deleted nominations
    const nominationsQuery = `
        SELECT n.*, c.name as category_name
        FROM nominations n
        LEFT JOIN categories c ON n.category = c.name
        WHERE n.deleted_at IS NOT NULL
        ORDER BY n.deleted_at DESC
    `;
    
    db.db.all(categoriesQuery, (err, deletedCategories) => {
        if (err) {
            console.error(err);
            deletedCategories = [];
        }
        
        db.db.all(nominationsQuery, (err, deletedNominations) => {
            if (err) {
                console.error(err);
                deletedNominations = [];
            }
            
            res.render('trash', { 
                deletedCategories, 
                deletedNominations, 
                user: req.session.user 
            });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Default admin credentials: admin / admin123');
    console.log('Default user credentials: user / user123');
});
