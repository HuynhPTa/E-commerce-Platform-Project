# MarketHub — Đặc tả chức năng và danh sách API

| Hạng mục | Nội dung |
|---|---|
| Phiên bản | 2.2 |
| Ngày | 2026-11-06 |
| Mô hình | **Website bán hàng độc lập một thương hiệu (single-brand store)** |
| Trạng thái | Đang triển khai |
| Tài liệu gốc | `docs/nguyen-tac-phat-trien.md` |
| Phạm vi | Chức năng đã có, API hiện hành và phần còn thiếu của giai đoạn 1 |

> Tài liệu này thay thế bản “single-shop mode” cũ. MarketHub vận hành như một trang bán hàng độc lập (hình mẫu: Adidas), không phải sàn nhiều shop. Module seller và bảng `shops` chỉ còn để tương thích dữ liệu, bị ẩn khỏi giao diện.

---

# 1. Mục tiêu

- Khách xem một catalog duy nhất của MarketHub, không thấy shop khác, không thấy đăng ký mở shop.
- Khách đăng ký/đăng nhập, quản lý hồ sơ, địa chỉ, giỏ hàng, đặt hàng, thanh toán và đánh giá.
- Admin quản lý toàn bộ catalog, biến thể, tồn kho, ảnh, danh mục, người dùng và đơn hàng.
- Giữ nguyên dữ liệu demo, đơn hàng, thanh toán và đánh giá hiện có; không refactor schema trong giai đoạn 1.
- Mọi số liệu hiển thị lấy từ backend/MySQL thật.

---

# 2. Nguyên tắc và phạm vi

Chi tiết đầy đủ tại `docs/nguyen-tac-phat-trien.md`. Các điểm bắt buộc:

1. Một thương hiệu, một shop chính thức về mặt vận hành.
2. Không có tác nhân Store Manager/Seller trong mô hình nghiệp vụ.
3. Không xoá bảng `shops`, cột `shop_id`, module seller backend hoặc dữ liệu lịch sử.
4. Không thay đổi schema trong giai đoạn 1 nếu không thật sự cần.
5. Không sửa dữ liệu demo của người dùng `206` và giỏ hàng liên quan.
6. Không tuyên bố VNPay/MoMo hoặc Google/Facebook chạy end-to-end khi chưa có credential.
7. UI storefront tiếng Việt, giữ bố cục/màu sắc/class CSS/prop `rating` của prototype.

---

# 3. Tác nhân và phân quyền

| Tác nhân | Mô tả | Quyền chính |
|---|---|---|
| **Khách (Guest)** | Chưa đăng nhập | Xem trang chủ, danh mục, sản phẩm, đánh giá; đăng ký, đăng nhập |
| **Khách hàng (Customer)** | Đã đăng nhập | Hồ sơ, địa chỉ, giỏ hàng, checkout, thanh toán, đơn của mình, đánh giá |
| **Quản trị viên (Admin)** | Tài khoản role `ADMIN` | Dashboard, người dùng, danh mục, sản phẩm, biến thể, tồn kho, ảnh, đơn hàng |
| **Cổng thanh toán** | VNPay/MoMo | Tiếp nhận giao dịch, gửi callback/IPN |
| **Hệ thống** | Thành phần nội bộ | Xử lý callback/IPN, cập nhật thanh toán/đơn hàng, tác vụ nền |

Quy tắc:

- API Admin dùng `@PreAuthorize("hasAuthority('ADMIN')")` ở cấp lớp.
- API khách hàng kiểm tra quyền sở hữu; tài nguyên của người khác trả `404`.
- API seller cũ vẫn kiểm tra chủ shop `APPROVED` nhưng không còn là luồng chính.
- Admin không cần sở hữu shop để quản lý sản phẩm.

---

# 4. Sitemap

## 4.1. Storefront (người mua)

Ứng dụng tại `Frontend`, dev `http://localhost:5173`.

| Route | Màn hình | Trạng thái |
|---|---|---|
| `/` | Trang chủ | Đã có |
| `/products` | Danh sách sản phẩm, tìm kiếm/lọc/sắp xếp | Đã có |
| `/products/:productId` | Chi tiết sản phẩm, chọn biến thể, đánh giá | Đã có |
| `/login`, `/register` | Đăng nhập/đăng ký | Đã có |
| `/account` | Hồ sơ và địa chỉ | Đã có |
| `/cart` | Giỏ hàng | Đã có |
| `/checkout` | Đặt hàng | Đã có |
| `/checkout/result` | Kết quả thanh toán | Đã có |
| `/orders`, `/orders/:orderId` | Danh sách/chi tiết đơn của tôi | Đã có |

## 4.2. Quản trị

Ứng dụng `Frontend`, dev `http://localhost:5173`, tiền tố `/admin`.

| Route | Màn hình | Trạng thái |
|---|---|---|
| `/admin` | Dashboard | Đã có |
| `/admin/users` | Người dùng | Đã có |
| `/admin/categories` | Danh mục | Đã có |
| `/admin/products` | Danh sách sản phẩm | Đã có |
| `/admin/products/new` | Tạo sản phẩm | Đã có |
| `/admin/products/:productId` | Sửa sản phẩm, biến thể, tồn kho, ảnh | Đã có |
| `/admin/orders` | Đơn hàng và cập nhật trạng thái | Đã có |

## 4.3. Route cũ giữ để tương thích

| Route | Trạng thái |
|---|---|
| `/shops/:shopId` | Còn route vì giỏ hàng/kết quả checkout cũ còn liên kết; không quảng bá |
| `/seller/*` | Đã bỏ khỏi cây route; code seller backend vẫn giữ |
| `/admin/shops` | Đã bỏ khỏi cây route và menu; code admin shop backend vẫn giữ |

---

# 5. Danh sách chức năng

Ký hiệu: **Đã có**, **Đã có (cần credential)**, **Chưa triển khai (đề xuất)**.

## 5.1. Khách và khách hàng

| ID | Chức năng | Trạng thái | Tiêu chí chính |
|---|---|---|---|
| F01 | Trang chủ | Đã có | Banner thương hiệu, danh mục, sản phẩm đề xuất; không CTA mở shop |
| F02 | Danh sách sản phẩm | Đã có | Ảnh, tên, giá, rating; phân trang; dữ liệu thật |
| F03 | Tìm kiếm/lọc/sắp xếp | Đã có | `q`, `category`, `minPrice`, `maxPrice`, `sort`, `page`; validate giá |
| F04 | Chi tiết sản phẩm | Đã có | Ảnh, mô tả, biến thể, giá, tồn kho, rating; thêm giỏ |
| F05 | Chọn phiên bản | Đã có | Chọn biến thể, giá và tồn kho cập nhật đúng |
| F06 | Xem đánh giá | Đã có | Danh sách đánh giá công khai, điểm trung bình |
| F07 | Đăng ký tài khoản | Đã có | Validate, email trùng báo lỗi |
| F08 | Đăng nhập/đăng xuất | Đã có | JWT; tài khoản bị khoá không đăng nhập |
| F09 | OAuth2 Google/Facebook | Đã có (cần credential) | Code có, chưa kiểm thử thật |
| F10 | Hồ sơ cá nhân | Đã có | Xem/cập nhật tên, SĐT, ngày sinh; email không đổi |
| F11 | Địa chỉ nhận hàng | Đã có | CRUD, đặt mặc định |
| F12 | Giỏ hàng | Đã có | Chọn từng dòng bằng checkbox (không tự chọn tất cả), thêm/sửa/xoá, kiểm tra tồn kho |
| F13 | Mua ngay | Đã có | Thêm biến thể đã chọn vào giỏ/checkout |
| F14 | Đặt hàng | Đã có | Chọn món, tỉnh/thành; phí theo vùng, miễn phí từ 499.000₫; COD hoặc cổng trực tuyến; mã chống trùng khi thử lại |
| F15 | Thanh toán VNPay/MoMo | Đã có (cần credential) | Tạo URL, verify chữ ký, xử lý callback chống trùng; callback muộn sau khi huỷ đánh dấu cần hoàn tiền; thiếu cấu hình trả 503/1180 |
| F16 | Xem kết quả thanh toán | Đã có | Trạng thái phiên; COD không hiện nhắc thanh toán trực tuyến; thanh toán lại khi còn hiệu lực; nhãn “Cần hoàn tiền” cho `REFUND_REQUIRED` |
| F17 | Danh sách/lọc đơn | Đã có | Chỉ đơn của mình; lọc trạng thái, phân trang |
| F18 | Chi tiết đơn | Đã có | Timeline, item, địa chỉ snapshot, payment; sửa nhận hàng khi `PENDING`; huỷ `PENDING`/`CONFIRMED` nếu chưa thanh toán trực tuyến; đơn người khác 404 |
| F19 | Đánh giá sản phẩm | Đã có | Chỉ đơn `COMPLETED`; mỗi món/mỗi sản phẩm trong đơn một lần |

## 5.2. Quản trị viên

| ID | Chức năng | Trạng thái | Tiêu chí chính |
|---|---|---|---|
| F20 | Dashboard | Đã có | User, sản phẩm, đơn, doanh thu, phân bố trạng thái, đơn gần đây |
| F21 | Quản lý người dùng | Đã có | Lọc/tìm; thống kê, xem chi tiết, tạo/sửa/xoá mềm; khoá/mở khoá; không tự thao tác trên mình hoặc Admin khác |
| F22 | Quản lý danh mục | Đã có | Cây + phẳng; thêm/sửa/xoá; chặn xoá khi còn con/sản phẩm |
| F23 | Xem danh sách sản phẩm quản trị | Đã có | `GET /api/admin/products`; tab đang bán/đã xoá; tìm kiếm, phân trang |
| F24 | Tạo sản phẩm | Đã có | `POST /api/admin/products`; gán shop chính thức, tạo biến thể đầu tiên |
| F25 | Xem chi tiết sản phẩm quản trị | Đã có | `GET /api/admin/products/{id}`; đủ biến thể/ảnh |
| F26 | Cập nhật sản phẩm | Đã có | `PUT /api/admin/products/{id}`; đổi tên/mô tả/danh mục |
| F27 | Xoá mềm sản phẩm | Đã có | `DELETE /api/admin/products/{id}`; `status = DELETED`, ẩn khỏi catalog |
| F28 | Quản lý biến thể và tồn kho | Đã có | Thêm/sửa/xoá variant; SKU duy nhất; không xoá variant cuối |
| F29 | Quản lý ảnh sản phẩm | Đã có | Tối đa 10 ảnh; JPEG/PNG/WEBP/GIF ≤ 5 MB; ảnh đầu làm bìa |
| F30 | Danh sách/lọc đơn hàng | Đã có | Mọi đơn; lọc trạng thái/từ khoá; phân trang |
| F31 | Chi tiết đơn hàng | Đã có | Item, người nhận, thanh toán, timeline |
| F32 | Cập nhật trạng thái đơn | Đã có | `PATCH /api/admin/orders/{id}/status`; đúng luồng, huỷ hoàn kho |
| F33 | Cấu hình website | Chưa triển khai (đề xuất UC44) | Chưa có entity/controller/route/UI |

## 5.3. Kỹ thuật và dữ liệu

| ID | Chức năng | Trạng thái | Ghi chú |
|---|---|---|---|
| F34 | Seed dữ liệu | Đã có | Giữ ID cố định, idempotent; không tạo marketplace mới |
| F35 | Dữ liệu cũ | Đã có | Không xoá shop/sản phẩm/đơn cũ; chỉ ẩn khỏi UI |
| F36 | Upload/static | Đã có | `/uploads/**`; giới hạn loại file và dung lượng |
| F37 | Build/test | Đã có | Backend 65 test; lint/build frontend |
| F38 | Phân trang/hiệu năng | Đã có | Mặc định 12; không N+1 mới |
| F39 | Bảo mật | Đã có | JWT, BCrypt, validate input, kiểm tra quyền sở hữu |

---

# 6. Danh sách API

## 6.1. Quy ước chung

- Base URL dev: `http://localhost:8080`
- Prefix: `/api`
- Response chuẩn:

```json
{ "code": 1000, "message": "Thành công", "result": {} }
```

- Lỗi:

```json
{ "code": 1061, "message": "Giỏ hàng trống", "result": null }
```

- Phân trang:

```json
{ "items": [], "page": 1, "size": 12, "totalItems": 300, "totalPages": 25 }
```

- Auth: `Authorization: Bearer <access_token>`.
- Quyền: **Public**, **Auth**, **Admin**.

## 6.2. Auth và hồ sơ

| Method | Endpoint | Quyền | Tham số chính | Mô tả |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | `email`, `password`, `firstName`, `lastName`, `phone`, `dateOfBirth?` | Đăng ký; email trùng lỗi 1002 |
| POST | `/api/auth/login` | Public | `email`, `password` | Trả token + userInfo |
| GET | `/oauth2/authorization/{provider}` | Public | `provider=google\|facebook` | Bắt đầu OAuth2; chưa test thật |
| GET | `/login/oauth2/code/{provider}` | Public | — | Callback Spring Security |
| GET | `/oauth2/redirect` | Public | `token` | Storefront nhận token |
| GET | `/api/me` | Auth | — | Hồ sơ hiện tại |
| PUT | `/api/me` | Auth | `firstName`, `lastName`, `phone`, `dateOfBirth` | Cập nhật hồ sơ |

## 6.3. Địa chỉ

| Method | Endpoint | Quyền | Tham số chính |
|---|---|---|---|
| GET | `/api/addresses` | Auth | — |
| POST | `/api/addresses` | Auth | `recipientName`, `phone`, `fullAddress` |
| PUT | `/api/addresses/{id}` | Auth | `recipientName`, `phone`, `fullAddress` |
| DELETE | `/api/addresses/{id}` | Auth | — |
| PUT | `/api/addresses/{id}/default` | Auth | — |

## 6.4. Danh mục

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/categories` | Public | Cây danh mục |
| GET | `/api/categories/flat` | Public | Danh mục phẳng |
| GET | `/api/categories/stats` | Admin | Thống kê tổng/gốc/lá, số danh mục có sản phẩm, độ sâu |
| POST | `/api/categories` | Admin | Tạo danh mục |
| PUT | `/api/categories/{id}` | Admin | Sửa danh mục |
| DELETE | `/api/categories/{id}` | Admin | Chặn nếu còn con/sản phẩm |

## 6.5. Sản phẩm công khai

| Method | Endpoint | Quyền | Tham số chính |
|---|---|---|---|
| GET | `/api/products` | Public | `q`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `size` |
| GET | `/api/products/{id}` | Public | — |
| GET | `/api/products/{productId}/reviews` | Public | `page`, `size` |
| GET | `/api/products/{productId}/review-eligibility` | Auth | — |

## 6.6. Giỏ hàng, checkout, thanh toán

| Method | Endpoint | Quyền | Tham số chính |
|---|---|---|---|
| GET | `/api/cart` | Auth | — |
| POST | `/api/cart` | Auth | `variantId`, `quantity` |
| PUT | `/api/cart/{itemId}` | Auth | `quantity` |
| DELETE | `/api/cart/{itemId}` | Auth | — |
| POST | `/api/checkout` | Auth | `recipientName`, `phone`, `fullAddress`, `province`, `paymentMethod` (`COD`/`VNPAY`/`MOMO`), `cartItemIds?`, `idempotencyKey?` |
| GET | `/api/checkout/{id}` | Auth | — |
| POST | `/api/payments/create-url` | Auth | `checkoutSessionId`, `provider` (`VNPAY`/`MOMO`) |
| GET | `/api/payments/vnpay/return` | Public | Query VNPay |
| GET | `/api/payments/vnpay/ipn` | Public | Query VNPay |
| GET | `/api/payments/momo/return` | Public | Query MoMo |
| POST | `/api/payments/momo/ipn` | Public | JSON MoMo |

**Ghi chú vòng đời checkout:**

- `idempotencyKey` là tuỳ chọn, tối đa 64 ký tự, duy nhất theo từng người mua. Gửi lại cùng khoá trả về phiên đã tạo thay vì tạo trùng đơn.
- Phiên trực tuyến `PENDING`/`FAILED` chưa thanh toán tự động hết hạn sau **120 phút** (cấu hình `checkout.expiry-minutes`): đơn `PENDING` bị huỷ, tồn kho hoàn lại; khi không còn đơn hiệu lực, tổng phiên và payment về 0, phiên chuyển `EXPIRED`, payment chuyển `FAILED`.
- COD được ghi nhận đã thu tiền khi mọi đơn còn hiệu lực trong phiên chuyển `DELIVERED` hoặc `COMPLETED`.
- Callback thành công đến sau khi mọi đơn đã huỷ không mở lại đơn; payment chuyển `REFUND_REQUIRED` (“Cần hoàn tiền”) và giữ số tiền cổng đã báo để đối soát thủ công.
- Doanh thu dashboard tính theo `completedAt` của đơn, không theo `createdAt`.

## 6.7. Đơn hàng và đánh giá của khách

| Method | Endpoint | Quyền | Tham số chính |
|---|---|---|---|
| GET | `/api/orders` | Auth | `status?`, `page`, `size` |
| GET | `/api/orders/{id}` | Auth | — |
| POST | `/api/orders/{id}/cancel` | Auth | Huỷ `PENDING`/`CONFIRMED` nếu chưa thanh toán trực tuyến thành công |
| PATCH | `/api/orders/{id}/shipping` | Auth | `recipientName`, `phone`, `fullAddress`, `province`; chỉ khi `PENDING` |
| POST | `/api/reviews` | Auth | `orderItemId`, `rating`, `comment?` |

## 6.8. Quản trị

| Method | Endpoint | Quyền | Tham số chính | Mô tả |
|---|---|---|---|---|
| GET | `/api/admin/ping` | Admin | — | Kiểm tra quyền |
| GET | `/api/admin/dashboard` | Admin | — | Số liệu toàn website |
| GET | `/api/admin/users` | Admin | `role?`, `status?`, `q?`, `page`, `size` | Danh sách user |
| GET | `/api/admin/users/stats` | Admin | — | Thống kê tổng/hoạt động/bị khoá/Admin/người mua |
| GET | `/api/admin/users/{id}` | Admin | — | Chi tiết user, số đơn và tổng chi tiêu |
| POST | `/api/admin/users` | Admin | `email`, `password`, `firstName`, `lastName`, `phone?`, `role?`, `status?` | Tạo tài khoản |
| PUT | `/api/admin/users/{id}` | Admin | Như trên; `password` để trống là giữ nguyên | Cập nhật tài khoản |
| DELETE | `/api/admin/users/{id}` | Admin | — | Xoá mềm; chặn xoá Admin |
| PATCH | `/api/admin/users/{id}/status` | Admin | `status` | Khoá/mở khoá |
| GET | `/api/admin/products` | Admin | `q?`, `status?`, `page`, `size` | Danh sách sản phẩm mọi shop cũ |
| POST | `/api/admin/products` | Admin | `name`, `description`, `categoryId`, `variants[]` | Tạo sản phẩm, gán shop chính thức |
| GET | `/api/admin/products/{id}` | Admin | — | Chi tiết sản phẩm |
| PUT | `/api/admin/products/{id}` | Admin | `name`, `description`, `categoryId` | Sửa sản phẩm |
| DELETE | `/api/admin/products/{id}` | Admin | — | Xoá mềm |
| POST | `/api/admin/products/{id}/variants` | Admin | `sku`, `attributes`, `priceMinor`, `stockQuantity`, `imageUrl?` | Thêm biến thể |
| PUT | `/api/admin/products/{id}/variants/{variantId}` | Admin | Như trên | Sửa biến thể |
| DELETE | `/api/admin/products/{id}/variants/{variantId}` | Admin | — | Xoá biến thể; chặn biến thể cuối |
| POST | `/api/admin/products/{id}/images` | Admin | `file` (multipart) | Upload ảnh |
| DELETE | `/api/admin/products/{id}/images/{imageId}` | Admin | — | Xoá ảnh |
| GET | `/api/admin/orders` | Admin | `status?`, `q?`, `page`, `size` | Danh sách đơn |
| GET | `/api/admin/orders/{id}` | Admin | — | Chi tiết đơn |
| PATCH | `/api/admin/orders/{id}/status` | Admin | `status` | Chuyển trạng thái, huỷ hoàn kho |

## 6.9. API seller cũ — chỉ giữ tương thích

Các endpoint dưới `/api/seller/**` và `/api/admin/shops/**` vẫn tồn tại trong backend nhưng không còn xuất hiện trên giao diện. Không dùng cho tính năng mới.

- `/api/seller/dashboard`, `/api/seller/products/**`, `/api/seller/orders/**`
- `/api/shops/**`, `/api/admin/shops/**`

---

# 7. Kế hoạch dữ liệu

1. Shop chính thức là shop `APPROVED` có id nhỏ nhất (hiện là shop id `1`). Không đổi tên hàng loạt nếu chưa được duyệt.
2. Sản phẩm do Admin tạo được gán `shop_id`/`shop_name` của shop chính thức để checkout gom đơn đúng.
3. Sản phẩm cũ thuộc shop khác **không gán lại hàng loạt**; Admin vẫn xem/sửa được qua API admin.
4. Không xoá shop cũ, không xoá đơn cũ, không đổi `orders.shop_id` lịch sử.
5. Không sửa hoặc xoá dữ liệu của người dùng demo `206`.
6. Seed tiếp tục idempotent và giữ ID cố định.

---

# 8. Kiểm chứng hiện tại

| Hạng mục | Kết quả |
|---|---|
| Backend `mvn test` | **65/65 pass**: gồm checkout idempotency/hết hạn, huỷ đơn/sửa nhận hàng/COD, callback muộn và `REFUND_REQUIRED`, đăng ký/JWT thu hồi, doanh thu theo `completedAt`, quản trị sản phẩm và đơn hàng |
| Frontend `npm run lint` | Pass |
| Frontend `npm run build` | Pass |
| Frontend `npm run build` | Pass (chỉ còn cảnh báo chunk > 500 kB có sẵn) |
| VNPay/MoMo end-to-end | **Chưa kiểm thử** — thiếu credential |
| Google/Facebook OAuth2 end-to-end | **Chưa kiểm thử** — thiếu credential |
| Kiểm thử trình duyệt giỏ hàng | **Đã kiểm thử**: mở giỏ không tự chọn tất cả; bấm nhanh nút tăng số lượng hai lần chỉ gửi một cập nhật và số lượng tăng đúng một đơn vị. |
| Kiểm thử trình duyệt checkout COD | **Đã kiểm thử**: chọn tỉnh miền Bắc hiển thị phụ phí 20.000₫, miền Nam 0₫; gửi đơn COD có `idempotencyKey`; trang kết quả hiển thị “Đặt hàng thành công”, “Thanh toán khi nhận hàng” và không nhắc thanh toán trực tuyến. |
| Kiểm thử trình duyệt huỷ đơn và phiên | **Đã kiểm thử**: hộp thoại xác nhận trước khi huỷ; sau khi huỷ, đơn hiển thị “Đã huỷ”, phiên có tổng 0₫, payment “Chưa thu tiền”, không còn nút thanh toán lại. Dữ liệu test đã được xoá khỏi DB. |
| Kiểm thử trình duyệt phiên đăng nhập | **Đã kiểm thử**: token không hợp lệ khi gọi API trả 401; toàn bộ khoá xác thực trong `localStorage` bị xoá và header chuyển về “Đăng nhập”. |
| Kiểm thử trình duyệt địa chỉ checkout | **Đã kiểm thử**: chọn “nhập địa chỉ mới” xoá người nhận/số điện thoại/địa chỉ/tỉnh và tính lại tổng; chọn lại địa chỉ đã lưu điền đúng thông tin. |
| Kiểm thử trình duyệt luồng admin sản phẩm | **Đã kiểm thử** trên MySQL thật: đăng nhập Admin, xem danh sách, tạo sản phẩm, sửa thông tin, thêm/sửa biến thể, upload/xoá ảnh, xoá mềm; tab “Đã xoá” và điều khiển chỉ đọc hiển thị đúng. Dữ liệu test đã được dọn khỏi DB và thư mục upload. |
| Kiểm thử trình duyệt danh mục quản trị | **Đã kiểm thử**: tạo danh mục gốc, sửa tên, thêm danh mục con, xoá con rồi xoá cha; số liệu thống kê trả về đúng và khôi phục `36 / 9 / 27` sau khi dọn dữ liệu. |
| Kiểm thử trình duyệt quản lý người dùng | **Đã kiểm thử**: thống kê `32 / 32 / 0 / 2 / 30`; tạo tài khoản, xem chi tiết, sửa họ tên/điện thoại, khoá/mở khoá và xoá mềm; số liệu, bộ lọc và trạng thái cập nhật đúng; tài khoản đang đăng nhập không tự sửa/xoá/khoá được. Tài khoản test đã được xoá khỏi DB. |
| Kiểm thử trình duyệt đơn người mua | **Đã kiểm thử**: COD hiển thị đúng, không nhắc thanh toán trực tuyến; sửa thông tin nhận hàng khi `PENDING`; huỷ đơn có hộp thoại xác nhận; đơn huỷ được loại khỏi tổng phiên. Dữ liệu test đã được xoá. |
| Kiểm thử trình duyệt vòng đời đơn quản trị | **Đã kiểm thử** trên đơn COD tạm: `PENDING → CONFIRMED → SHIPPING → DELIVERED → COMPLETED`; doanh thu và thống kê cập nhật đúng. Đơn/payment/session test đã được xoá và tồn kho được hoàn. |

---

# 9. Rủi ro và cách giảm

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Còn link marketplace | Trung bình | Rà header, home, footer, menu admin; test UI |
| Admin sửa nhầm sản phẩm shop cũ | Thấp | Danh sách admin hiển thị rõ tên/ID; thao tác xoá mềm |
| Sản phẩm mới gán sai shop | Thấp | Luôn lấy shop `APPROVED` id nhỏ nhất; test tự động |
| Mất dữ liệu lịch sử | Cao | Không xoá cứng; backup trước thao tác SQL |
| Test thanh toán/OAuth giả | Cao | Chỉ ghi “cần credential”; không tuyên bố chạy thật |
| Ảnh mồ côi khi upload lỗi | Thấp | Service xoá file nếu ghi DB thất bại |
| UC mô tả sai trạng thái | Trung bình | Chỉ đánh dấu “Đã có” khi có API + UI + kiểm chứng |

---

# 10. Ngoài phạm vi giai đoạn 1

- Không xoá bảng `shops`, không bỏ `shop_id`, không xoá module seller backend.
- Không làm cấu hình website (UC44) — chuyển sang đề xuất.
- Không làm quên/đổi mật khẩu, quản lý đánh giá.
- Không làm multi-warehouse, coupon, tích điểm, chat, thông báo realtime.
- Không làm trả hàng/hoàn tiền tự động; khách chỉ tự huỷ đơn chưa bàn giao và chưa thanh toán trực tuyến thành công. Giao dịch đến sau khi đơn đã huỷ được đánh dấu `REFUND_REQUIRED` để đối soát thủ công.
- Không kiểm thử thanh toán/OAuth thật khi chưa có credential.

---

# 11. Quyết định đã chốt

1. Mô hình **single-brand**, không phải marketplace.
2. Không có tác nhân Store Manager/Seller; Admin quản lý catalog và đơn hàng.
3. Giữ schema và module seller backend để tương thích; ẩn khỏi UI.
4. Shop chính thức: shop `APPROVED` id nhỏ nhất; không gán lại sản phẩm cũ hàng loạt.
5. Admin tạo sản phẩm mới → gán shop chính thức.
6. Admin xử lý `DELIVERED → COMPLETED`; UC24 chỉ mở sau đó.
7. UC44 chuyển sang đề xuất vì chưa triển khai.
8. Không commit thay đổi nếu người dùng chưa yêu cầu.

---

# 12. Checklist triển khai

- [x] API quản trị sản phẩm (`/api/admin/products/**`) + test.
- [x] UI quản trị sản phẩm (danh sách, tạo, sửa, biến thể, ảnh).
- [x] Giỏ hàng chọn từng món; checkout theo tỉnh/thành, COD và phí giao hàng theo vùng.
- [x] Khách huỷ đơn và sửa thông tin nhận hàng khi còn `PENDING`.
- [x] Admin quản lý người dùng đầy đủ (thống kê, chi tiết, tạo/sửa/xoá mềm, khoá/mở khoá).
- [x] Ẩn CTA seller khỏi header và trang chủ.
- [x] Ẩn menu duyệt shop khỏi admin.
- [x] Cập nhật tài liệu nguyên tắc, đặc tả và use case.
- [x] Chống trùng checkout, tự đóng phiên hết hạn, hoàn tồn kho và xử lý callback muộn.
- [x] Thu hồi JWT khi tài khoản bị khoá/xoá mềm; xoá cache storefront khi đổi phiên đăng nhập.
- [x] Kiểm thử trình duyệt luồng admin sản phẩm, danh mục, đơn hàng trên MySQL thật.
- [x] Dọn dữ liệu test sau kiểm thử trình duyệt.
- [ ] Kiểm thử thanh toán/OAuth khi có credential.
