# Website Bình Chọn Đề Cử

Một hệ thống bình chọn trực tuyến với giao diện đẹp, hệ thống đăng nhập và phân quyền người dùng.

## Tính năng chính

### 🗳️ Hệ thống bình chọn
- Bình chọn cho các đề cử theo danh mục
- Giao diện trực quan, dễ sử dụng
- Hỗ trợ đa danh mục (Công nghệ, Giáo dục, Y tế, Văn hóa)

### 👥 Quản lý người dùng
- Đăng ký tài khoản mới
- Đăng nhập/đăng xuất
- Phân quyền: Admin và User thường

### 🔒 Bảo mật
- Mật khẩu được mã hóa bằng bcrypt
- Session-based authentication
- Phân quyền truy cập theo vai trò

### 📊 Kết quả bình chọn (Chỉ Admin)
- Xem thống kê chi tiết
- Xuất dữ liệu CSV/JSON
- Phân tích theo danh mục

### 🛠️ Quản lý hệ thống (Chỉ Admin)
- Thêm/sửa/xóa đề cử
- Quản lý người dùng
- Thay đổi vai trò người dùng

## Cài đặt

### Yêu cầu hệ thống
- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd voting-website
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Khởi chạy ứng dụng
```bash
# Chế độ development (với nodemon)
npm run dev

# Hoặc chế độ production
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## Tài khoản mặc định

### Admin
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@example.com`

### Tạo tài khoản mới
- Truy cập `/register` để tạo tài khoản mới
- Tài khoản mới sẽ có vai trò "user" mặc định

## Cấu trúc dự án

```
voting-website/
├── server.js              # Server chính
├── package.json           # Dependencies và scripts
├── views/                 # EJS templates
│   ├── layout.ejs        # Layout chung
│   ├── index.ejs         # Trang chủ
│   ├── login.ejs         # Trang đăng nhập
│   ├── register.ejs      # Trang đăng ký
│   ├── results.ejs       # Trang kết quả (Admin)
│   └── admin.ejs         # Trang quản lý (Admin)
├── public/                # Static files
│   └── css/
│       └── style.css     # CSS tùy chỉnh
└── README.md             # Hướng dẫn này
```

## Công nghệ sử dụng

### Backend
- **Express.js** - Web framework
- **SQLite3** - Database
- **bcryptjs** - Mã hóa mật khẩu
- **express-session** - Quản lý session
- **connect-flash** - Flash messages

### Frontend
- **Bootstrap 5** - CSS framework
- **Font Awesome** - Icons
- **EJS** - Template engine
- **jQuery** - JavaScript library

### Database Schema
- **users** - Thông tin người dùng
- **nominations** - Danh sách đề cử
- **votes** - Phiếu bình chọn

## API Endpoints

### Public Routes
- `GET /` - Trang chủ
- `GET /login` - Trang đăng nhập
- `POST /login` - Xử lý đăng nhập
- `GET /register` - Trang đăng ký
- `POST /register` - Xử lý đăng ký
- `GET /logout` - Đăng xuất

### Protected Routes (User)
- `POST /vote` - Bình chọn cho đề cử

### Admin Only Routes
- `GET /results` - Xem kết quả bình chọn
- `GET /admin` - Trang quản lý

## Tính năng bảo mật

1. **Mã hóa mật khẩu:** Sử dụng bcrypt với salt rounds = 10
2. **Session management:** Sử dụng express-session với secret key
3. **Input validation:** Kiểm tra dữ liệu đầu vào
4. **SQL injection protection:** Sử dụng parameterized queries
5. **CSRF protection:** Có thể bổ sung thêm

## Tùy chỉnh

### Thay đổi port
Sửa biến `PORT` trong `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Thay đổi database
Thay đổi từ SQLite sang MySQL/PostgreSQL:
1. Cài đặt driver tương ứng
2. Cập nhật connection string
3. Sửa các câu query SQL nếu cần

### Thêm danh mục mới
Sửa trong `server.js` phần sample nominations hoặc thêm qua giao diện admin.

## Troubleshooting

### Lỗi thường gặp

1. **Port đã được sử dụng**
   - Thay đổi port trong `server.js`
   - Hoặc dừng service đang sử dụng port đó

2. **Database error**
   - Kiểm tra quyền ghi file trong thư mục
   - Xóa file `voting.db` để tạo lại database

3. **Module not found**
   - Chạy `npm install` để cài đặt dependencies

### Logs
Kiểm tra console để xem logs và error messages.

## Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub.

---

**Lưu ý:** Đây là dự án demo, không nên sử dụng trong môi trường production mà không có các biện pháp bảo mật bổ sung.
