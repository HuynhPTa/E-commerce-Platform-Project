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

Sau khi MySQL và Backend đang chạy, tạo dữ liệu demo nền:

```bash
node scripts/seed-demo.mjs
```

Script tạo 3 shop đã duyệt + 1 shop chờ duyệt, 12 sản phẩm có ảnh, 2 tài khoản Buyer, giỏ hàng 3 shop, 10 đơn demo (9 buyer + 1 buyer2) đủ 6 trạng thái, payment VNPay/MoMo và review. Phần catalog đi qua API thật; phần đơn hàng/payment/review dùng SQL local qua Docker (chỉ dev). Chạy lại nhiều lần không tạo dữ liệu trùng. Mật khẩu chung của tài khoản demo là `Demo@123`. Seed chỉ bổ sung, không xoá dữ liệu cũ — nếu DB đã có dữ liệu E2E thì dashboard vẫn tính cả dữ liệu đó.

### Dữ liệu demo lớn (tuỳ chọn)

Sau khi đã chạy seed nền, bổ sung bộ dữ liệu lớn để demo dashboard, tìm kiếm và phân trang:

```bash
node scripts/seed-large-demo.mjs
```

Script tạo thêm 12 shop đã duyệt + 2 shop chờ duyệt, 8 tài khoản Buyer, 288 sản phẩm (mỗi sản phẩm 2 variant và 1 ảnh SVG dùng chung theo nhóm danh mục), 190 đơn hàng, 30 đơn bổ sung cho `buyer.demo`/`buyer2.demo`, payment và review. Dữ liệu dùng ID cố định `2001+` và `INSERT IGNORE`, nên chạy lại không nhân đôi. Tổng sau cả hai seed: **300 sản phẩm, 18 shop (15 đã duyệt, 3 chờ duyệt), 29 tài khoản, 230 đơn hàng**. Ảnh SVG được sinh vào `Backend/uploads/product-images/seed-cat-*.svg`.

Xem chi tiết tại [`scripts/README.md`](scripts/README.md).

---

## 💳 Cấu hình thanh toán (VNPay / MoMo)

Backend đọc cấu hình từ biến môi trường (hoặc khai báo trong `Backend/src/main/resources/application-secrets.properties`, tệp này đã được gitignore):

| Biến | Ý nghĩa |
|---|---|
| `VNPAY_TMN_CODE` | Mã website/TMN Code do VNPay cấp |
| `VNPAY_HASH_SECRET` | Chuỗi bí mật ký HMAC-SHA512 |
| `VNPAY_PAY_URL` | Mặc định `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNPAY_RETURN_URL` | Mặc định `http://localhost:8080/api/payments/vnpay/return` |
| `MOMO_PARTNER_CODE` | Partner code do MoMo cấp |
| `MOMO_ACCESS_KEY` | Access key MoMo |
| `MOMO_SECRET_KEY` | Secret key ký HMAC-SHA256 |
| `MOMO_ENDPOINT` | Mặc định `https://test-payment.momo.vn/v2/gateway/api/create` |
| `MOMO_RETURN_URL` | Mặc định `http://localhost:8080/api/payments/momo/return` |
| `MOMO_IPN_URL` | Mặc định `http://localhost:8080/api/payments/momo/ipn` |

Ví dụ chạy Backend với VNPay sandbox:

```powershell
$env:VNPAY_TMN_CODE='<tmn-code>'
$env:VNPAY_HASH_SECRET='<hash-secret>'
cd Backend; mvn spring-boot:run
```

Khi chưa có credential, `POST /api/payments/create-url` trả **503** với mã `1180` (`PAYMENT_NOT_CONFIGURED`); hệ thống **không** giả lập thanh toán thành công. Đơn hàng vẫn được tạo ở trạng thái `PENDING` để có thể thanh toán lại sau.

---

## 🔁 Chống trùng đơn và vòng đời thanh toán

- `POST /api/checkout` nhận `idempotencyKey` tuỳ chọn (tối đa 64 ký tự, duy nhất theo người mua). Storefront giữ nguyên khoá khi người dùng thử lại, nên mạng lỗi hoặc bấm lại không tạo trùng đơn.
- Phiên trực tuyến `PENDING`/`FAILED` chưa thanh toán tự động hết hạn sau **120 phút**: đơn `PENDING` bị huỷ, tồn kho được hoàn và tổng phiên về 0 khi không còn đơn hiệu lực.
- COD chỉ được ghi nhận đã thu tiền khi đơn chuyển `DELIVERED` hoặc `COMPLETED`.
- Callback thành công đến sau khi mọi đơn đã huỷ không mở lại đơn; giao dịch được đánh dấu `REFUND_REQUIRED` (“Cần hoàn tiền”) để đối soát thủ công.
- Dashboard tính doanh thu theo `completedAt`, không theo ngày tạo đơn.

---

## 🧾 Trang đơn hàng của người mua

Sau khi đặt hàng, người mua có thể vào **Đơn hàng của tôi** (`/orders`) để:

- Lọc đơn theo trạng thái, phân trang.
- Xem chi tiết đơn (`/orders/{id}`), timeline trạng thái, địa chỉ nhận hàng và trạng thái thanh toán.
- Bấm **Thanh toán ngay** nếu đơn còn `PENDING` và chưa thanh toán.

API tương ứng: `GET /api/orders?status=&page=&size=` và `GET /api/orders/{id}`. Đơn của người khác trả `404` để không lộ sự tồn tại của đơn.

---

## ✅ Kiểm chứng

```bash
cd Backend && mvn test          # 65 test pass
cd Frontend && npm run lint     # pass
cd Frontend && npm run build    # pass
```

Lưu ý: bộ test thanh toán dùng credential giả trên H2 và không gọi mạng. Chưa kiểm thử giao dịch thật với cổng sandbox vì chưa có credential VNPay/MoMo.