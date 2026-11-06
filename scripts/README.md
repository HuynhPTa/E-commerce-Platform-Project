# Scripts

## Seed dữ liệu mẫu

`seed-demo.mjs` tạo dữ liệu demo: phần tài khoản/shop/sản phẩm đi qua **API thật**; phần đơn hàng/payment/review dùng **SQL local qua Docker** (chỉ dev) vì API không có endpoint tạo lịch sử giao dịch.

- 3 tài khoản Seller + 3 shop đã duyệt, 1 shop `PENDING` để test Admin duyệt.
- 12 sản phẩm thuộc các danh mục công nghệ, thời trang, nhà cửa; mỗi sản phẩm có variant và ảnh PNG.
- 2 tài khoản Buyer + địa chỉ; giỏ hàng có sẵn 3 món từ 3 shop để test checkout nhiều shop.
- 9 đơn demo cho `buyer.demo` đủ 6 trạng thái (`PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `COMPLETED`, `CANCELLED`) + 1 đơn của `buyer2.demo` để test 404.
- Payment VNPAY/MoMo ở cả `PENDING`, `SUCCEEDED`, `FAILED`; review cho đơn `COMPLETED`; rating và `sold_count` được tính lại từ dữ liệu thật.

Script **idempotent**: chạy lại sẽ dùng tài khoản/shop/sản phẩm đã có, chỉ bổ sung variant, ảnh, địa chỉ hoặc đơn còn thiếu. Script **không xoá** dữ liệu cũ; nếu DB đã có dữ liệu E2E, dashboard vẫn tính cả dữ liệu đó.

### Điều kiện

- MySQL Docker đang chạy (`docker compose up -d mysql-db`).
- Backend đang chạy tại `http://localhost:8080` và đã seed danh mục mặc định.
- Node.js 18+ (dùng `fetch` và `FormData` có sẵn).
- Docker CLI dùng được lệnh `docker exec` (để seed đơn hàng/payment/review qua SQL local).
- File SQL: `Backend/src/main/resources/db/seed/demo-seed.sql` (script tự tìm, không cần truyền đường dẫn).

### Chạy

Tại thư mục gốc dự án:

```bash
node scripts/seed-demo.mjs
```

Kết quả in ra tài khoản demo, shop, sản phẩm và số ảnh. Mật khẩu chung mặc định là `Demo@123`.

Sau khi phần API chạy xong, script thực thi `Backend/src/main/resources/db/seed/demo-seed.sql` qua `docker exec` để thêm đơn hàng, payment, review và giỏ hàng. Phần này idempotent: chạy lại không nhân đôi đơn/payment. Nếu Docker không khả dụng, script vẫn hoàn tất phần API và in cảnh báo; có thể chạy SQL thủ công:

```bash
docker cp Backend/src/main/resources/db/seed/demo-seed.sql ecommerce-mysql:/tmp/demo-seed.sql
docker exec ecommerce-mysql mysql -uroot --default-character-set=utf8mb4 ecommerce_db \
  -e "source /tmp/demo-seed.sql"
```

### Tài khoản demo

| Vai trò | Email | Shop |
|---|---|---|
| Seller | `seller.demo@markethub.vn` | MarketHub Demo - Công nghệ |
| Seller | `seller.style@markethub.vn` | MarketHub Demo - Thời trang |
| Seller | `seller.home@markethub.vn` | MarketHub Demo - Nhà cửa |
| Seller (chờ duyệt) | `seller.pending@markethub.vn` | MarketHub Seed - Shop chờ duyệt |
| Buyer | `buyer.demo@markethub.vn` | — |
| Buyer 2 | `buyer2.demo@markethub.vn` | — |
| Admin | `admin@markethub.vn` | — |

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

## Seed dữ liệu demo lớn

`seed-large-demo.mjs` bổ sung bộ dữ liệu lớn để demo dashboard, tìm kiếm và phân trang. Script **phải chạy sau** `seed-demo.mjs` vì dùng tài khoản `buyer.demo`/`buyer2.demo` cho 30 đơn bổ sung.

- 12 shop đã duyệt (mỗi shop 24 sản phẩm) + 2 shop `PENDING` để test Admin duyệt.
- 8 tài khoản Buyer (`buyer03.demo`–`buyer10.demo`).
- 288 sản phẩm, mỗi sản phẩm 2 variant; dùng 9 ảnh SVG theo nhóm danh mục, sinh vào `Backend/uploads/product-images/seed-cat-*.svg`.
- 190 đơn hàng (ID `2001`–`2190`) + 30 đơn cho `buyer.demo`/`buyer2.demo` (ID `3001`–`3030`), đủ 6 trạng thái; payment VNPay/MoMo và review cho đơn `COMPLETED`.
- Tổng sau cả hai seed: 300 sản phẩm, 598 variant, 300 ảnh, 18 shop (15 đã duyệt, 3 chờ duyệt), 29 tài khoản, 230 đơn, 229 payment, 66 review.

Script dùng ID cố định `2001+` và `INSERT IGNORE` để chạy lại không nhân đôi. Script **không xoá** dữ liệu cũ.

### Chạy

Tại thư mục gốc dự án, sau khi seed nền hoàn tất:

```bash
node scripts/seed-large-demo.mjs
```

### Tài khoản demo lớn

Mật khẩu chung: `Demo@123`.

| Vai trò | Email | Shop |
|---|---|---|
| Seller | `seller.large.techzone@markethub.vn` | MarketHub Tech Zone |
| Seller | `seller.large.mobile@markethub.vn` | MarketHub Mobile Store |
| Seller | `seller.large.laptop@markethub.vn` | MarketHub Laptop Center |
| Seller | `seller.large.fashion@markethub.vn` | MarketHub Fashion House |
| Seller | `seller.large.women@markethub.vn` | MarketHub Women Style |
| Seller | `seller.large.sneaker@markethub.vn` | MarketHub Sneaker Lab |
| Seller | `seller.large.home@markethub.vn` | MarketHub Home Decor |
| Seller | `seller.large.beauty@markethub.vn` | MarketHub Beauty Corner |
| Seller | `seller.large.books@markethub.vn` | MarketHub Book & Office |
| Seller | `seller.large.sport@markethub.vn` | MarketHub Sport & Travel |
| Seller | `seller.large.kids@markethub.vn` | MarketHub Kids World |
| Seller | `seller.large.gadget@markethub.vn` | MarketHub Gadget Pro |
| Seller (chờ duyệt) | `seller.large.pending2@markethub.vn` | MarketHub Seed - Shop chờ duyệt 2 |
| Seller (chờ duyệt) | `seller.large.pending3@markethub.vn` | MarketHub Seed - Shop chờ duyệt 3 |
| Buyer | `buyer03.demo@markethub.vn` … `buyer10.demo@markethub.vn` | — |

### Biến môi trường

Giống seed nền: `MYSQL_CONTAINER`, `MYSQL_DATABASE`, `MYSQL_ROOT_PASSWORD`. Script không gọi API nên không cần `API_BASE`.

### Dựng lại DB demo từ đầu

Chỉ dùng cho môi trường dev. Sao lưu DB trước khi xoá:

```bash
docker exec ecommerce-mysql sh -c \
  'mysqldump -uroot --single-transaction --routines --triggers --default-character-set=utf8mb4 ecommerce_db > /tmp/ecommerce_db_backup.sql'
docker cp ecommerce-mysql:/tmp/ecommerce_db_backup.sql ./ecommerce_db_backup.sql
```

Sau đó truncate các bảng nghiệp vụ theo thứ tự an toàn (giữ `categories` và `flyway_schema_history`):

```sql
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE reviews;
TRUNCATE TABLE order_items;
TRUNCATE TABLE payments;
TRUNCATE TABLE orders;
TRUNCATE TABLE checkout_sessions;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE product_images;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE products;
TRUNCATE TABLE address;
TRUNCATE TABLE shops;
TRUNCATE TABLE user;
SET FOREIGN_KEY_CHECKS=1;
UPDATE user_seq SET next_val=1;
UPDATE address_seq SET next_val=1;
```

Chạy lại `seed-demo.mjs` rồi `seed-large-demo.mjs`. Seed nền tự tạo lại tài khoản admin `admin@markethub.vn` nếu chưa có.
