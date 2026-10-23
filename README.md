hi
# 🛒 E-Commerce Platform Project

Dự án website thương mại điện tử Fullstack xây dựng bằng **Spring Boot 3** (Backend) và **React + TanStack** (Frontend), sử dụng **MySQL (Docker)** làm hệ quản trị cơ sở dữ liệu.

---

## 🛠️ Yêu cầu môi trường (Prerequisites)
* **Node.js** (v18+) & **npm**
* **Java SDK** (v17+) & **Maven**
* **Docker Desktop** (Đã mở và đang chạy)

---

## 🚀 Hướng dẫn khởi chạy ứng dụng (Quick Start)

### 1. Khởi động Database (MySQL Docker)
Mở terminal tại thư mục gốc dự án và chạy:

```bash
docker compose up -d mysql-db
```

---

## 🌱 Dữ liệu mẫu (Seed)

Sau khi MySQL và Backend đang chạy, tạo 3 shop + 6 sản phẩm có ảnh + tài khoản Buyer mẫu:

```bash
node scripts/seed-demo.mjs
```

Script gọi API thật, chạy lại nhiều lần không tạo dữ liệu trùng. Mật khẩu chung của tài khoản demo là `Demo@123`. Xem chi tiết tại [`scripts/README.md`](scripts/README.md).