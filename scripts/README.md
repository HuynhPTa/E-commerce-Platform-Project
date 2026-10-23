# Scripts

## Seed dữ liệu mẫu

`seed-demo.mjs` tạo dữ liệu demo qua **API thật** của backend (không sửa schema, không insert thẳng DB):

- 3 tài khoản Seller + 3 shop đã duyệt.
- 6 sản phẩm thuộc các danh mục công nghệ, thời trang, nhà cửa; mỗi sản phẩm có variant và ảnh PNG.
- 1 tài khoản Buyer + địa chỉ mặc định để thử checkout nhiều shop.

Script **idempotent**: chạy lại sẽ dùng tài khoản/shop/sản phẩm đã có, chỉ bổ sung variant, ảnh hoặc địa chỉ còn thiếu.

### Điều kiện

- MySQL Docker đang chạy (`docker compose up -d mysql-db`).
- Backend đang chạy tại `http://localhost:8080` và đã seed danh mục mặc định.
- Node.js 18+ (dùng `fetch` và `FormData` có sẵn).

### Chạy

Tại thư mục gốc dự án:

```bash
node scripts/seed-demo.mjs
```

Kết quả in ra tài khoản demo, shop, sản phẩm và số ảnh. Mật khẩu chung mặc định là `Demo@123`.

### Tài khoản demo

| Vai trò | Email | Shop |
|---|---|---|
| Seller | `seller.demo@markethub.vn` | MarketHub Demo - Công nghệ |
| Seller | `seller.style@markethub.vn` | MarketHub Demo - Thời trang |
| Seller | `seller.home@markethub.vn` | MarketHub Demo - Nhà cửa |
| Buyer | `buyer.demo@markethub.vn` | — |

### Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `API_BASE` | `http://localhost:8080/api` | URL API backend |
| `DEMO_PASSWORD` | `Demo@123` | Mật khẩu tài khoản demo |
| `ADMIN_EMAIL` | `admin@markethub.vn` | Tài khoản admin để duyệt shop |
| `ADMIN_PASSWORD` | `Admin@123` | Mật khẩu admin |
| `MYSQL_CONTAINER` | `ecommerce-mysql` | Tên container MySQL |
| `MYSQL_DATABASE` | `ecommerce_db` | Tên database |
| `MYSQL_ROOT_PASSWORD` | rỗng | Mật khẩu root MySQL (nếu có) |
| `SEED_JSON` | `0` | Đặt `1` để in thêm JSON tổng kết |

Ví dụ đổi mật khẩu demo:

```bash
# Bash
DEMO_PASSWORD='MatKhauKhac@123' node scripts/seed-demo.mjs

# PowerShell
$env:DEMO_PASSWORD='MatKhauKhac@123'; node scripts/seed-demo.mjs
```

### Duyệt shop

Script ưu tiên gọi `PATCH /api/admin/shops/{id}/status` bằng tài khoản admin. Hiện JWT của backend luôn gắn `scope=USER` nên tài khoản admin bị 403 ở API admin; khi đó script tự fallback sang:

```bash
docker exec ecommerce-mysql mysql -uroot ecommerce_db \
  -e "UPDATE shops SET status='APPROVED', reviewed_at=NOW() WHERE id=<shopId>;"
```

Fallback này **chỉ dành cho môi trường dev local**. Khi lỗi JWT admin được sửa, script sẽ tự dùng API Admin và không cần quyền Docker.
