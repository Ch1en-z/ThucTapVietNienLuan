# Hệ thống Bình chọn Online

Hệ thống bình chọn online với database SQLite để lưu trữ thông tin người dùng, danh mục, ứng viên và phiếu bầu.

## 🚀 Tính năng chính

- **Quản lý người dùng**: Đăng ký, đăng nhập, phân quyền admin/user
- **Quản lý danh mục**: Tạo, chỉnh sửa, xóa danh mục bình chọn
- **Quản lý ứng viên**: Thêm, chỉnh sửa, xóa ứng viên theo danh mục
- **Hệ thống bình chọn**: Bình chọn ứng viên với giới hạn thời gian
- **Giao diện admin**: Quản lý toàn bộ hệ thống
- **Giao diện user**: Xem kết quả và gửi đề xuất
- **Database SQLite**: Lưu trữ dữ liệu an toàn với backup tự động

## 📊 Database

### Cấu trúc Database
- **Users**: Thông tin người dùng và phân quyền
- **Categories**: Danh mục bình chọn với thời gian kết thúc
- **Nominations**: Ứng viên trong từng danh mục
- **Votes**: Phiếu bầu của người dùng
- **Suggestions**: Đề xuất và phản hồi từ người dùng
- **Activity Logs**: Log hoạt động hệ thống
- **System Settings**: Cài đặt hệ thống

### Tính năng Database
- ✅ Backup tự động
- ✅ Soft delete (không xóa dữ liệu hoàn toàn)
- ✅ Activity logging
- ✅ System settings
- ✅ Foreign key constraints
- ✅ Indexes tối ưu

## 🛠️ Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd DoAnThucTap
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Chạy server**
```bash
node server.js
```

4. **Truy cập ứng dụng**
- URL: http://localhost:3000
- Admin: admin / admin123
- User: user / user123

## 📁 Cấu trúc thư mục

```
DoAnThucTap/
├── server.js              # Server chính
├── database.js            # Database class
├── package.json           # Dependencies
├── views/                 # EJS templates
│   ├── layout.ejs
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── admin.ejs
│   └── ...
├── backups/               # Database backups (tự động tạo)
├── voting.db              # Database file (tự động tạo)
└── DATABASE_README.md     # Hướng dẫn database
```

## 🔧 Cấu hình

### Database
- File: `voting.db` (tự động tạo)
- Backup: `backups/` (tự động tạo)
- Tất cả database files được ignore trong git

### System Settings
- `voting_enabled`: Bật/tắt bình chọn
- `registration_enabled`: Bật/tắt đăng ký
- `maintenance_mode`: Chế độ bảo trì
- `max_votes_per_user`: Số vote tối đa mỗi user
- `session_timeout`: Thời gian timeout session

## 👥 Tài khoản mặc định

### Admin
- Username: `admin`
- Password: `admin123`
- Email: `admin@example.com`
- Quyền: Quản lý toàn bộ hệ thống

### User
- Username: `user`
- Password: `user123`
- Email: `user@example.com`
- Quyền: Bình chọn và gửi đề xuất

## 🎯 Sử dụng

### Cho Admin
1. Đăng nhập với tài khoản admin
2. Quản lý danh mục: `/manage-categories`
3. Quản lý ứng viên: `/admin`
4. Xem đề xuất: `/suggestions`
5. Xem kết quả chi tiết: `/admin/results`

### Cho User
1. Đăng ký tài khoản mới hoặc đăng nhập
2. Xem danh sách ứng viên và bình chọn
3. Gửi đề xuất: `/suggest-nomination`
4. Gửi phản hồi: `/feedback`
5. Xem kết quả: `/results`

## 🔒 Bảo mật

- Mật khẩu được mã hóa với bcrypt
- Session management
- Input validation
- SQL injection protection
- XSS protection

## 📈 Monitoring

- Activity logs cho mọi hoạt động
- Database statistics
- System health monitoring
- Backup tự động

## 🚀 Production

### Chuẩn bị cho production
1. Thay đổi session secret
2. Cấu hình HTTPS
3. Sử dụng PM2 hoặc similar process manager
4. Cấu hình reverse proxy (nginx)
5. Monitoring và logging

### Database cho nhiều người dùng
- Database đã được tối ưu cho concurrent access
- WAL mode enabled
- Proper indexing
- Connection pooling ready
- Backup strategy implemented

## 📝 API Endpoints

### Public
- `GET /` - Trang chủ
- `GET /login` - Trang đăng nhập
- `POST /login` - Xử lý đăng nhập
- `GET /register` - Trang đăng ký
- `POST /register` - Xử lý đăng ký
- `GET /results` - Xem kết quả

### Protected (User)
- `POST /vote` - Bình chọn
- `GET /suggest-nomination` - Gửi đề xuất ứng viên
- `POST /suggest-nomination` - Xử lý đề xuất
- `GET /feedback` - Gửi phản hồi
- `POST /feedback` - Xử lý phản hồi

### Admin Only
- `GET /admin` - Dashboard admin
- `GET /admin/results` - Kết quả chi tiết
- `GET /manage-categories` - Quản lý danh mục
- `POST /add-category` - Thêm danh mục
- `GET /suggestions` - Xem đề xuất
- `GET /trash` - Thùng rác

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License

## 📞 Hỗ trợ

Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ trực tiếp.

---

**Lưu ý**: Database sẽ được tạo tự động khi chạy server lần đầu. Tất cả dữ liệu mẫu sẽ được thêm vào database.
