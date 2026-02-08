# 🎱 Nine Ball Spring Open 2026

Hệ thống quản lý giải đấu Billiards 9-Ball theo **Swiss System** (Hệ thống Thụy Sĩ).

## ✨ Tính năng

- 🎲 **Swiss Pairing**: Tự động ghép cặp theo thuật toán Swiss
  - Vòng 1: Ngẫu nhiên
  - Vòng 2+: Theo thứ hạng (người cùng điểm gặp nhau)
- 📊 **Bảng xếp hạng**: Real-time với tie-breaker (Rack Difference)
- 🎯 **Quản lý trận đấu**: Cập nhật tỉ số, lịch sử các vòng
- 👥 **Quản lý người chơi**: Tối đa 32 người, có hạng thi đấu
- 📱 **Responsive**: Hoạt động tốt trên mobile

## 🚀 Cách sử dụng

### Deploy lên Google Apps Script

1. Tạo project mới tại [script.google.com](https://script.google.com)
2. Copy các file sau vào project:
   - `code.gs` - API chính
   - `swiss.gs` - Thuật toán Swiss
   - `Index.html` - Trang công khai
   - `admin.html` - Trang admin
   - `styles.html` - CSS
3. Click **Deploy** → **New deployment** → **Web app**
4. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy URL được cấp

### Truy cập

| Trang | URL |
|-------|-----|
| Công khai | `YOUR_URL` |
| Admin | `YOUR_URL?key=admin123&page=admin` |

> ⚠️ Đổi `admin123` thành mật khẩu riêng trong `code.gs` dòng 7

## 📋 Hướng dẫn Admin

1. **Cấu hình giải đấu**: Đặt tên + số vòng
2. **Thêm người chơi**: Nhập tên + hạng (A/B/C/D)
3. **Bắt đầu vòng 1**: Click "Tạo cặp đấu"
4. **Nhập tỉ số**: Điền kết quả từng trận
5. **Tiếp tục vòng mới**: Khi tất cả trận hoàn thành

## 🏗️ Kiến trúc

```
NineBallSpringOpen2026/
├── code.gs       # API routing + endpoints
├── swiss.gs      # Swiss algorithm + data helpers
├── Index.html    # Public scoreboard
├── admin.html    # Admin panel
├── styles.html   # Premium CSS
├── DEV_LOG.md    # Development history
└── README.md     # This file
```

## 📝 License

MIT License - Free to use and modify.