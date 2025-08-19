# Hướng dẫn sử dụng Database

## Tổng quan
Dự án sử dụng SQLite database để lưu trữ thông tin người dùng, danh mục, ứng viên, và phiếu bầu.

## Cấu trúc Database

### Bảng Users
- `id`: ID duy nhất của người dùng
- `username`: Tên đăng nhập (duy nhất)
- `password`: Mật khẩu đã mã hóa
- `email`: Email (duy nhất)
- `role`: Vai trò (user/admin)
- `is_active`: Trạng thái hoạt động
- `last_login`: Lần đăng nhập cuối
- `login_count`: Số lần đăng nhập
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật

### Bảng Categories
- `id`: ID duy nhất của danh mục
- `name`: Tên danh mục (duy nhất)
- `description`: Mô tả danh mục
- `end_time`: Thời gian kết thúc bình chọn
- `status`: Trạng thái (active/inactive)
- `max_nominations`: Số ứng viên tối đa
- `deleted_at`: Thời gian xóa (soft delete)
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật

### Bảng Nominations
- `id`: ID duy nhất của ứng viên
- `name`: Tên ứng viên
- `description`: Mô tả ứng viên
- `category`: Danh mục
- `image_url`: Đường dẫn ảnh
- `is_approved`: Trạng thái phê duyệt
- `created_by`: ID người tạo
- `deleted_at`: Thời gian xóa (soft delete)
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật

### Bảng Votes
- `id`: ID duy nhất của phiếu bầu
- `user_id`: ID người dùng
- `nomination_id`: ID ứng viên
- `ip_address`: Địa chỉ IP
- `user_agent`: User agent
- `created_at`: Thời gian tạo

### Bảng Suggestions
- `id`: ID duy nhất của đề xuất
- `user_id`: ID người dùng
- `type`: Loại đề xuất (nomination/feedback)
- `title`: Tiêu đề
- `description`: Mô tả
- `status`: Trạng thái (pending/processed)
- `priority`: Độ ưu tiên
- `assigned_to`: ID người được giao
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật

### Bảng Activity Logs
- `id`: ID duy nhất của log
- `user_id`: ID người dùng
- `action`: Hành động
- `table_name`: Tên bảng
- `record_id`: ID bản ghi
- `old_values`: Giá trị cũ
- `new_values`: Giá trị mới
- `ip_address`: Địa chỉ IP
- `user_agent`: User agent
- `created_at`: Thời gian tạo

### Bảng System Settings
- `id`: ID duy nhất của cài đặt
- `setting_key`: Khóa cài đặt (duy nhất)
- `setting_value`: Giá trị cài đặt
- `description`: Mô tả
- `updated_at`: Thời gian cập nhật

## Tài khoản mặc định

### Admin
- Username: `admin`
- Password: `admin123`
- Email: `admin@example.com`

### User
- Username: `user`
- Password: `user123`
- Email: `user@example.com`

## Tính năng Database

### Backup tự động
- Database được backup tự động vào thư mục `backups/`
- Tên file: `voting_backup_YYYY-MM-DDTHH-MM-SS.db`

### Logging
- Tất cả hoạt động được ghi log vào bảng `activity_logs`
- Bao gồm thông tin IP và User Agent

### Soft Delete
- Các bảng Categories và Nominations sử dụng soft delete
- Dữ liệu không bị xóa hoàn toàn, chỉ đánh dấu `deleted_at`

### System Settings
- Các cài đặt hệ thống được lưu trong bảng `system_settings`
- Có thể thay đổi mà không cần restart server

## Sử dụng trong code

```javascript
const Database = require('./database');

// Khởi tạo database
const db = new Database();
await db.connect();

// Thực hiện query
db.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
        console.error(err);
    } else {
        console.log(user);
    }
});

// Backup database
await db.backup();

// Log activity
await db.logActivity(userId, 'LOGIN', 'users', userId, null, null, req);

// Get system setting
const setting = await db.getSetting('voting_enabled');

// Set system setting
await db.setSetting('maintenance_mode', 'true');

// Get statistics
const stats = await db.getStats();
```

## Lưu ý
- Database file: `voting.db`
- Backup folder: `backups/`
- Tất cả database files được ignore trong git
- Database được khởi tạo tự động khi chạy server
