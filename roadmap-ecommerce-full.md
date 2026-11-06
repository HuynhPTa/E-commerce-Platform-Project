# Sàn thương mại điện tử (mô hình Shopee) — Tài liệu tổng hợp dự án

**Timeline:** 8 tuần
**Trạng thái:** Đang triển khai — Backend đã chạy (Spring Boot + MySQL, port 8080), Frontend đang wiring TanStack (port 5173)

---

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 19 + Vite + TanStack Query + TanStack Router |
| Form/Validation | React Hook Form + Zod |
| Backend | Java Spring Boot 3.3.3 (Web, Data JPA, Security/JWT, AOP) |
| CSDL | MySQL 8 (qua mysql-connector-j) |
| ORM | Hibernate 6.5.2 (Spring Data JPA) |
| Migration | Flyway (khuyến nghị — xem lưu ý ở §5) |
| Auth | JWT (JSON Web Token) |
| Thanh toán | VNPay sandbox + Momo sandbox (thật, không dùng COD-only) |
| Lưu trữ ảnh | S3-compatible (Cloudflare R2 / MinIO) |
| Tìm kiếm | PostgreSQL/MySQL full-text search — chưa cần Elasticsearch ở MVP |
| Build tool | Maven (Backend), Vite (Frontend) |
| IDE đang dùng | IntelliJ IDEA 2025.2.1, Java 23 (valhalla-ea) |

> **Lưu ý về CSDL**: Roadmap ban đầu thiết kế cho PostgreSQL (dùng kiểu `UUID`, `JSONB`, `tsvector`). Bạn hiện đang chạy **MySQL** (thấy trong log: `mysql-connector-j-8.3.0`, `HHH000511: MySQLDialect`). Hai lựa chọn:
> - **Giữ MySQL**: đổi `UUID` → `CHAR(36)` hoặc dùng `BINARY(16)`, đổi `JSONB` → `JSON` (MySQL 8 hỗ trợ `JSON` native), bỏ `tsvector` và dùng `FULLTEXT INDEX` của MySQL thay thế.
> - **Đổi sang PostgreSQL**: khớp đúng 100% thiết kế gốc, nhưng phải cấu hình lại `application.yml` + cài lại driver.
> Nên chốt sớm vì ảnh hưởng toàn bộ 13 bảng ở §3.

---

## 2. Vai trò & phạm vi sản phẩm

Ba vai trò: **Buyer, Seller (user có shop), Admin**. Mô hình **1 user = 1 shop**, Admin duyệt shop.

**Tính năng MVP bắt buộc:**
Auth · Category · Product + Variant · Search/Filter · Cart (nhóm theo shop) · Checkout tách đơn theo shop · Payment (VNPay/Momo sandbox) · Order tracking · Review · Seller dashboard · Admin duyệt shop & category.

**Ngoài phạm vi 8 tuần** (loại hẳn, không chỉ hoãn): voucher, chat, livestream, đa ngôn ngữ.

---

## 3. CSDL — schema chính

Quy ước: `id` khoá chính (UUID hoặc CHAR(36) tuỳ engine chọn ở §1), tiền tệ lưu `*_minor` (VNĐ = đồng, không có phần thập phân), mọi bảng có `created_at`; bảng sửa được có thêm `updated_at`.

### 3.1 `users`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| email | VARCHAR(254) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | argon2/bcrypt |
| full_name | VARCHAR(120) | |
| phone | VARCHAR(20) | |
| is_admin | BOOLEAN DEFAULT false | |
| deleted_at | TIMESTAMP NULL | soft delete |

### 3.2 `shops`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| user_id | FK→users.id, UNIQUE | 1 user = 1 shop |
| name | VARCHAR(160) NOT NULL | |
| description | TEXT | |
| logo_url | VARCHAR(512) | |
| status | VARCHAR(16) | PENDING/APPROVED/REJECTED/SUSPENDED |

### 3.3 `categories`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| parent_id | FK→categories.id, NULL | cây danh mục nhiều cấp |
| name | VARCHAR(120) NOT NULL | |
| slug | VARCHAR(140) UNIQUE NOT NULL | |

### 3.4 `products`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| shop_id | FK→shops.id | |
| category_id | FK→categories.id | |
| name | VARCHAR(200) NOT NULL | |
| slug | VARCHAR(220) UNIQUE | |
| description | TEXT | |
| status | VARCHAR(16) | DRAFT/ACTIVE/HIDDEN |
| rating_avg | NUMERIC(2,1) DEFAULT 0 | denormalized |
| rating_count | INT DEFAULT 0 | |
| sold_count | INT DEFAULT 0 | denormalized |
| deleted_at | TIMESTAMP NULL | |

> Giá & tồn kho **không** nằm ở `products` — luôn ở `product_variants`, kể cả sản phẩm không có biến thể (tạo 1 variant mặc định). Tránh 2 nguồn giá.

### 3.5 `product_variants`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| product_id | FK→products.id | |
| sku | VARCHAR(64) UNIQUE | |
| attributes | JSON | vd `{"color":"Đỏ","size":"M"}` |
| price_minor | INT NOT NULL CHECK(>0) | |
| stock_quantity | INT NOT NULL DEFAULT 0 CHECK(>=0) | |
| image_url | VARCHAR(512) | |

### 3.6 `product_images`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| product_id | FK→products.id | |
| url | VARCHAR(512) NOT NULL | |
| sort_order | SMALLINT DEFAULT 0 | |

### 3.7 `addresses`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| user_id | FK→users.id | |
| recipient_name | VARCHAR(120) NOT NULL | |
| phone | VARCHAR(20) NOT NULL | |
| full_address | TEXT NOT NULL | không tách tỉnh/huyện/xã (đơn giản hoá MVP) |
| is_default | BOOLEAN DEFAULT false | |

### 3.8 `cart_items`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| user_id | FK→users.id | |
| variant_id | FK→product_variants.id | |
| quantity | INT NOT NULL CHECK(>0) | |
| — | UNIQUE(user_id, variant_id) | thêm lại = tăng quantity |

> Không cần bảng `carts` riêng — giỏ hàng = tập `cart_items` theo `user_id`; nhóm theo shop tính động qua `variant.product.shop_id`.

### 3.9 `checkout_sessions`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| buyer_id | FK→users.id | |
| status | VARCHAR(16) | PENDING/PAID/FAILED/EXPIRED |
| total_amount_minor | INT NOT NULL | tổng tất cả order con |

> Lý do có bảng này: checkout 1 lần có thể sinh nhiều `orders` (mỗi shop 1 đơn) nhưng chỉ 1 lượt thanh toán — đây là điểm neo.

### 3.10 `orders`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| checkout_session_id | FK→checkout_sessions.id | |
| buyer_id | FK→users.id | |
| shop_id | FK→shops.id | mỗi order thuộc đúng 1 shop |
| status | VARCHAR(16) | PENDING/CONFIRMED/SHIPPING/DELIVERED/COMPLETED/CANCELLED |
| shipping_address_snapshot | JSON NOT NULL | copy địa chỉ lúc đặt, không FK sống |
| subtotal_minor | INT NOT NULL | |
| shipping_fee_minor | INT DEFAULT 0 | |
| total_minor | INT NOT NULL | |

### 3.11 `order_items`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| order_id | FK→orders.id | |
| variant_id | FK→product_variants.id | ref thôi, không cascade xoá |
| product_name_snapshot | VARCHAR(200) NOT NULL | tên lúc mua |
| variant_attributes_snapshot | JSON | |
| unit_price_minor | INT NOT NULL | giá lúc mua |
| quantity | INT NOT NULL | |
| subtotal_minor | INT NOT NULL | |

### 3.12 `payments`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| checkout_session_id | FK→checkout_sessions.id, UNIQUE | |
| provider | VARCHAR(16) | VNPAY/MOMO |
| provider_transaction_id | VARCHAR(255) NULL | |
| amount_minor | INT NOT NULL | |
| status | VARCHAR(16) | PENDING/SUCCEEDED/FAILED |
| paid_at | TIMESTAMP NULL | |

### 3.13 `reviews`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | PK | |
| order_item_id | FK→order_items.id, UNIQUE | 1 review/1 order_item đã mua |
| user_id | FK→users.id | |
| product_id | FK→products.id | |
| rating | SMALLINT CHECK(1..5) | |
| comment | TEXT | |

**Sơ đồ quan hệ:**
```
users ──1:1── shops ──1:N── products ──1:N── product_variants
users ──1:N── addresses
users ──1:N── cart_items ──N:1── product_variants
users ──1:N── checkout_sessions ──1:N── orders ──1:N── order_items
checkout_sessions ──1:1── payments
orders ──1:N── order_items ──1:1── reviews (qua order_item_id)
categories ──self-ref (parent_id)── categories
```

---

## 4. Cấu trúc dự án

### 4.1 Backend (Spring Boot)

```
Backend/src/main/java/com/ecommerce/
├── config/           SecurityConfig, JwtConfig, CorsConfig, OpenApiConfig
├── controller/        Authentication, User, Category, Shop, Product, ProductVariant,
│                      Cart, Address, Checkout, Order, Payment, Review, Admin
├── dto/
│   ├── request/       Login, Register, Category, Shop, Product, ProductVariant,
│   │                  AddToCart, UpdateCartItem, Address, Checkout, UpdateOrderStatus, Review
│   └── response/       User, Category, Shop, Product, ProductVariant, CartItem,
│                        Address, Order, OrderItem, Payment, Review, PageResponse
├── entity/            User, Shop, Category, Product, ProductVariant, ProductImage,
│                      Address, CartItem, CheckoutSession, Order, OrderItem, Payment, Review
├── exception/         GlobalExceptionHandler, ResourceNotFoundException, BadRequestException,
│                      UnauthorizedException, InsufficientStockException
├── repository/        (1 repo/entity, ≥1 custom method mỗi repo có filter)
├── service/           (1 service/domain); CheckoutService xử lý 1 giỏ → nhiều order
├── util/              JwtUtil, SlugUtil, MoneyUtil
└── EcommerceApplication.java

Backend/src/main/resources/
├── application.yml / application-dev.yml / application-prod.yml
└── db/migration/       V1__create_users.sql ... V13__create_reviews.sql   (Flyway)
```

**Đã có (theo IntelliJ/log hiện tại):** `AuthenticationController`, `AuthenticationService`, `UserRepository`, `LoginRequest`/`RegisterRequest`, `LoginResponse`, kết nối MySQL thành công.

**Còn thiếu:** `SecurityConfig`/`JwtConfig` thật (chặn 401), `UserController` (`/me`), toàn bộ controller/service/repository cho category/shop/product/cart/checkout/order/payment/review/admin, và endpoint `/register` (đang bị 404 — cần kiểm tra path thật trong `AuthenticationController`).

### 4.2 Frontend (Vite + React 19 + TanStack)

```
Frontend/src/
├── components/        common/ (ErrorBoundary), layout/, product/ (ProductCard, VariantSelector),
│                      cart/ (CartItemRow), order/, review/
├── routes/             __root.jsx, index.jsx, login.jsx, register.jsx,
│                      products/index.jsx (+$productId.jsx), cart.jsx, checkout.jsx,
│                      seller/dashboard.jsx (lazy), admin/dashboard.jsx (lazy)
├── api/                gọi HTTP thô (axios) — client.js, auth.api.js, product.api.js,
│                      cart.api.js, checkout.api.js — KHÔNG chứa logic cache
├── queries/            useAuth.js, useProducts.js, useCart.js (optimistic), useCheckout.js
├── hooks/              useDebounce.js, useDisclosure.js — KHÔNG gọi API
├── schemas/            checkout.schema.js, product-search.schema.js (Zod)
├── lib/                queryClient.js, router.jsx
├── App.jsx             QueryClientProvider + RouterProvider + ReactQueryDevtools
└── main.jsx
```

**Trạng thái hiện tại:** đã wiring xong TanStack Query + Router, có mutation `useLoginMutation`/`useRegisterMutation` với optimistic cart update thật, form checkout dùng React Hook Form + Zod, code splitting Seller/Admin qua `lazy()`. Dev server chạy được ở `localhost:5173`. Đang vướng: gọi `/register` bị 404 do path FE/BE chưa khớp (cần đối chiếu `VITE_API_BASE_URL` với `@RequestMapping` thật trong `AuthenticationController`).

---

## 5. Chiến lược Server State & Cache (TanStack Query)

| Dữ liệu | Query key | staleTime | Invalidate khi |
|---|---|---|---|
| Danh sách sản phẩm | `['products', filters]` | 3 phút | Seller sửa/xoá sản phẩm cùng danh mục |
| Chi tiết sản phẩm | `['product', id]` | 2 phút | Có review mới, seller cập nhật |
| Giỏ hàng | `['cart']` | 0 | Optimistic ngay khi mutate + refetch nền |
| Đơn hàng của tôi | `['orders','me']` | 1 phút | Đặt đơn mới, trạng thái đơn đổi |
| Hồ sơ user | `['user','me']` | 5 phút | Sau khi login thành công |

---

## 6. Mô tả đầy đủ từng tính năng

### 6.1 Auth (Đăng ký / Đăng nhập)
- **Backend**: `POST /api/auth/register` tạo user mới (hash password bằng bcrypt/argon2, kiểm tra email trùng); `POST /api/auth/login` verify credential, trả JWT; `GET /api/me` lấy hồ sơ user hiện tại (yêu cầu Bearer token). `SecurityConfig` phải chặn mọi endpoint khác 401 nếu không có token hợp lệ.
- **Frontend**: `routes/login.jsx`, `routes/register.jsx` dùng `useLoginMutation`/`useRegisterMutation`; token lưu `localStorage`, gắn tự động qua axios interceptor (`api/client.js`); sau login invalidate `['user','me']`.
- **OAuth2 Google/Facebook**: dùng Spring Security OAuth2 client sẵn có (`/oauth2/authorization/{google|facebook}`). Backend tự tạo user nếu email chưa tồn tại, chặn tài khoản bị khoá/xoá mềm, cấp JWT rồi redirect về `/oauth2/redirect?token=...`. Credential lấy từ `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`; redirect URI khai báo ở provider là `http://localhost:8080/login/oauth2/code/{google|facebook}`.

### 6.2 Category (Danh mục)
- **Backend**: CRUD `categories` (chỉ Admin tạo/sửa/xoá), `GET /api/categories` public trả cây danh mục (dùng `parent_id` tự tham chiếu). Cần API trả dạng cây (nested) hoặc flat + FE tự dựng cây.
- **Frontend**: hiển thị sidebar/dropdown lọc theo category; dùng trong `validateSearch` của trang sản phẩm.

### 6.3 Shop
- **Backend**: `POST /api/shops` — user đăng ký mở shop (tạo bản ghi `status=PENDING`, tuần đầu có thể auto-approve tạm); `GET /api/shops/{id}` xem thông tin shop công khai; Admin duyệt qua `PATCH /api/admin/shops/{id}/status`.
- **Frontend**: form đăng ký shop (tên, mô tả, logo); trang public xem shop + danh sách sản phẩm của shop đó.

### 6.4 Product + Variant
- **Backend**: CRUD `products`/`product_variants`/`product_images` (chỉ Seller sở hữu shop mới sửa được sản phẩm của mình — kiểm tra `shop.user_id == currentUser.id`); ảnh upload lên S3-compatible, lưu `url` vào `product_images`.
- **Frontend**: `routes/seller/products/` (CRUD form, có upload ảnh), `components/product/VariantSelector.jsx` (chọn biến thể ở trang chi tiết).

### 6.5 Search/Filter
- **Backend**: `GET /api/products?category=&minPrice=&maxPrice=&sort=&page=&q=` — filter qua JPA Specification hoặc query method (`findByCategoryIdAndStatus`), tìm kiếm full-text theo tên/mô tả.
- **Frontend**: `routes/products/index.jsx` với `validateSearch` (Zod) — search params type-safe trên URL, debounce ô tìm kiếm (`hooks/useDebounce.js`).

### 6.6 Cart (nhóm theo shop)
- **Backend**: `GET/POST/PUT/DELETE /api/cart` — thêm lại sản phẩm đã có trong giỏ thì tăng `quantity` (UNIQUE constraint), không tạo dòng mới.
- **Frontend**: `queries/useCart.js` — **optimistic update thật**: UI đổi ngay khi bấm "Thêm vào giỏ", rollback nếu BE trả lỗi (vd hết hàng — `InsufficientStockException`). Trang `/cart` nhóm theo shop, có stepper số lượng, cảnh báo tồn kho thấp, tóm tắt đơn sticky và trạng thái rỗng/loading/error; chưa đăng nhập thì hiện lời mời đăng nhập thay vì gọi API.

### 6.7 Checkout (tách đơn theo shop)
- **Backend**: `POST /api/checkout` — logic quan trọng nhất: 1 giỏ hàng có sản phẩm từ N shop → tạo `checkout_session` + N `orders` (mỗi order 1 shop) trong **cùng 1 `@Transactional`**, đồng thời trừ `stock_quantity` (check `>= quantity` trong cùng câu lệnh update để tránh race condition).
- **Frontend**: `routes/checkout.jsx` — form địa chỉ/thanh toán dùng React Hook Form + Zod (≥4 field); mutation **không optimistic** (liên quan tiền) — chờ response thật rồi chuyển sang `/checkout/result`. Trang kết quả hiển thị trạng thái phiên + nút "Thanh toán VNPay/MoMo" gọi `POST /api/payments/create-url`; nếu cổng chưa cấu hình, đơn vẫn được tạo và API trả **503 `PAYMENT_NOT_CONFIGURED`**, không giả lập thanh toán thành công.

### 6.8 Payment (VNPay/Momo sandbox)
- **Backend**: `PaymentProvider` interface với 2 implementation (`VnPayProvider` — HMAC-SHA512, `MomoProvider` — HMAC-SHA256 và gọi API tạo URL). Endpoint: `POST /api/payments/create-url`, `GET /api/payments/vnpay/{return,ipn}`, `GET /api/payments/momo/return`, `POST /api/payments/momo/ipn`. Callback/IPN verify chữ ký, đối chiếu `amount_minor`, khóa payment bằng `PESSIMISTIC_WRITE` và **idempotent**: gọi lặp không cộng tiền/trừ kho lần hai; thành công cập nhật `payments.status=SUCCEEDED`, `checkout_sessions.status=PAID`, `orders.status: PENDING → CONFIRMED`.
- **Frontend**: chọn provider ở checkout → trang `/checkout/result` hiển thị `paymentStatus` và nút thanh toán; bấm mới gọi API tạo URL rồi redirect sang cổng thanh toán. Sau khi provider redirect về, trang đọc lại kết quả từ `GET /api/checkout/{id}`, không tin param trên URL.

### 6.9 Order tracking
- **Backend**: `GET /api/orders` (buyer xem đơn của mình, lọc `status`, phân trang), `GET /api/orders/{id}` (kiểm tra ownership, trả 404 nếu không phải đơn của mình); Seller cập nhật trạng thái qua `PATCH /api/seller/orders/{id}/status`; Admin cập nhật toàn sàn qua `PATCH /api/admin/orders/{id}/status`.
- **Frontend**: `routes/orders/index.jsx` + `routes/orders/$orderId.jsx` — danh sách theo tab trạng thái, chi tiết đơn, timeline trạng thái (`components/order/OrderTimeline.jsx`), nút thanh toán lại khi đơn chưa thanh toán.

### 6.10 Review
- **Backend**: `POST /api/reviews` — chỉ tạo được nếu `order_item` liên quan có đơn ở trạng thái `COMPLETED` (kiểm tra qua `order_item_id`, UNIQUE — chặn review khống/review nhiều lần).
- **Frontend**: `components/review/ReviewForm.jsx`, `ReviewList.jsx`, `RatingSummary.jsx`.

### 6.11 Seller Dashboard
- **Backend**: `GET /api/seller/dashboard` tổng hợp doanh thu đơn `COMPLETED`, số đơn theo trạng thái, sản phẩm đang bán; `GET /api/seller/orders` + `GET /api/seller/orders/{id}`; `PATCH /api/seller/orders/{id}/status` theo luồng `PENDING → CONFIRMED → SHIPPING → DELIVERED → COMPLETED`, huỷ được ở `PENDING`/`CONFIRMED` và hoàn tồn kho.
- **Frontend**: `routes/seller/dashboard.jsx`, `orders.jsx`, `settings.jsx` — bundle riêng, lazy-load, tách khỏi bundle Buyer. Cài đặt shop dùng `PUT /api/shops/me`, đổi tên shop đồng bộ sang sản phẩm.

### 6.12 Admin
- **Backend**: duyệt shop (`PATCH /api/admin/shops/{id}/status`), quản lý category, `GET /api/admin/dashboard`, `GET /api/admin/orders` + chi tiết + `PATCH /api/admin/orders/{id}/status` (cập nhật trạng thái, huỷ hoàn kho), `GET /api/admin/users` và `PATCH /api/admin/users/{id}/status` (khoá/mở khoá, chặn tự khoá và khoá tài khoản ADMIN).
- **Frontend**: `routes/admin/dashboard.jsx`, `shops.jsx`, `categories.jsx`, `orders.jsx` (xem chi tiết và xử lý trạng thái), `users.jsx` — bundle riêng, lazy-load.

---

## 7. Rủi ro cần theo dõi

1. **Tồn kho race-condition**: transaction + kiểm tra `stock_quantity >= quantity` trong cùng 1 câu update, không đọc-rồi-ghi riêng lẻ.
2. **Checkout nhiều shop → nhiều order**: phần dễ bug nhất, viết test riêng.
3. **Webhook IPN gọi lặp** (VNPay/Momo): phải idempotent.
4. 8 tuần là gấp: nếu trễ, cắt trước ở tối ưu (index DB)/polish UI — **không cắt** CSDL hay luồng checkout/payment.
5. **MySQL vs PostgreSQL** (mới phát sinh): chốt sớm để tránh phải sửa lại toàn bộ kiểu dữ liệu 13 bảng giữa chừng.

---

## 8. Danh sách công việc F0 → Fn

| # | Việc | Layer | Trạng thái |
|---|------|-------|---|
| F0 | Setup Vite+React19+TanStack, kết nối Spring Boot+MySQL | FE+BE | ✅ Xong |
| F1 | Cài & wire TanStack Query/Router; `queryClient.js`, `router.jsx`; `App.jsx` bọc Provider + ErrorBoundary | FE | ✅ Xong |
| F2 | JWT thật + `SecurityConfig` chặn 401 | BE | ✅ Xong — JWT HS512, endpoint thiếu token trả 401; scope lấy theo `is_admin`/`role` |
| F3 | `useLoginMutation`, `useRegisterMutation`, invalidate `['user','me']` | FE | ✅ Xong (đăng ký/đăng nhập chạy thật, có OAuth2 Google/Facebook) |
| F4 | `UserController /me`; `GlobalExceptionHandler` | BE | ✅ Xong |
| F5 | `categories` — entity, migration, CRUD API + FE | FE+BE | ✅ Xong (cây danh mục, admin CRUD, sidebar/dropdown) |
| F6 | `shops` — entity, migration, đăng ký shop | FE+BE | ✅ Xong (đăng ký, trang public, admin duyệt/khoá, seller sửa thông tin shop) |
| F7 | `products`+`product_variants`+`product_images` | FE+BE | ✅ Xong — CRUD Seller, variant, upload/xoá ảnh, gallery Buyer; E2E Seller tạo sản phẩm có ảnh |
| F8 | Trang danh sách + chi tiết sản phẩm | FE | ✅ Xong |
| F9 | Tìm kiếm + lọc + phân trang | FE+BE | ✅ Xong (validateSearch, debounce, lọc category/giá/sort) |
| F10 | `cart_items` — optimistic mutation | FE+BE | ✅ Xong (optimistic update + rollback khi lỗi) |
| F11 | `addresses` | FE+BE | ✅ Xong (CRUD + địa chỉ mặc định) |
| F12 | `checkout_sessions`+`orders`+`order_items` trong `@Transactional` | BE | ✅ Xong — transaction tách đơn theo shop, trừ kho, 11/11 test pass; E2E checkout 2 shop thành công |
| F13 | VNPay sandbox | BE+FE | ✅ Xong — tạo URL, return/IPN, verify HMAC-SHA512, idempotent; 7 test payment (gồm callback lặp, sai chữ ký, sai amount). Chưa test cổng thật vì chưa có credential sandbox. |
| F14 | Momo sandbox | BE+FE | ✅ Xong — tạo URL qua API MoMo, return/IPN verify HMAC-SHA256, idempotent; test callback MoMo. Chưa test cổng thật vì chưa có credential sandbox. |
| F15 | Theo dõi & cập nhật trạng thái đơn | FE+BE | ✅ Xong — Buyer có danh sách + chi tiết đơn, timeline; Seller/Admin cập nhật trạng thái theo luồng chung, huỷ hoàn kho. |
| F16 | `reviews` | FE+BE | ✅ Xong — POST /api/reviews + eligibility + danh sách; rating_avg/count tự tính; UI chọn sao/form/phân trang; 9 test review |
| F17 | Seller Dashboard | FE+BE | ✅ Xong — doanh thu/đơn theo trạng thái/sản phẩm, quản lý đơn, cài đặt shop |
| F18 | Admin | FE+BE | ✅ Xong — dashboard tổng hợp, đơn toàn sàn (xem, lọc, cập nhật trạng thái), người dùng, shop/category |
| F19 | Index DB | BE | ✅ Xong — FULLTEXT `products.name`, B-tree shop/category/status-created, trigger `sold_count`; migration V11–V14 |
| F20 | Code splitting/Profiler | FE | ✅ Đã tách bundle seller/admin |
| F21 | Test checkout nhiều shop + webhook | FE+BE | ✅ Xong — **41/41 test pass**: 11 checkout nhiều shop, 7 payment (URL/IPN/idempotency/sai chữ ký/sai amount/ownership/method), 2 buyer orders, 9 review, 8 admin (gồm cập nhật trạng thái/hoàn kho), 4 seller |
| F22 | Build production, polish, demo | FE+BE | 🔶 Một phần — `npm run lint` + `npm run build` pass; còn thiếu credential sandbox để demo thanh toán/OAuth2 thật |
| F23 | Trang chủ: khối sản phẩm đề xuất (dùng API F9, sort `best_selling`) | FE | ✅ Xong — 8 sản phẩm, có link xem tất cả |

**Việc tiếp theo** (theo thứ tự ưu tiên):
1. Cấu hình credential VNPay/MoMo sandbox thật và kiểm thử một giao dịch end-to-end (tạo URL → thanh toán → IPN/return → đơn `CONFIRMED`).
2. Cấu hình Google/Facebook thật và kiểm thử OAuth2 end-to-end.
3. Hoàn thiện F22: quay video demo luồng mua hàng + thanh toán + seller xử lý đơn; có thể bổ sung trang quản lý payment cho Admin (ngoài roadmap 8 tuần).

### 8.1 Kết quả kiểm chứng gần nhất (2026-11-05)

- Đã merge đủ 4 gói vào `dev-huynh`: A `532ee23`, B `617c1e1`, C `a632955`, D `6a848a8`.
- Backend merged chạy `mvn test`: **11/11 test pass** (gồm integration test checkout tách đơn theo shop).
- E2E UI thật:
  - Seller tạo sản phẩm mới, upload ảnh PNG; API sản phẩm trả `images.length=1`, URL ảnh trả HTTP 200.
  - Buyer thêm 2 sản phẩm từ 2 shop, checkout tổng **548.000 ₫**; tạo checkout session 2 order, tồn kho mỗi variant giảm 10 → 9, giỏ hàng rỗng sau khi đặt.
  - Trang kết quả đọc dữ liệu từ `GET /api/checkout/{id}` (không đọc số liệu từ URL); kiểm tra ownership trả đúng 404/401 cho session không thuộc buyer.
- Seed dữ liệu mẫu: `node scripts/seed-demo.mjs` tạo 3 shop đã duyệt + 1 shop chờ duyệt, 12 sản phẩm có ảnh, 2 buyer, giỏ hàng 3 shop, 10 đơn demo (9 buyer + 1 buyer2) đủ 6 trạng thái, payment VNPay/MoMo và review; phần đơn/payment/review dùng SQL local qua Docker, chạy lại không tạo bản ghi trùng.
- Trang chủ có khối **Sản phẩm đề xuất** (F23): lấy 8 sản phẩm từ API F9 với `sort=best_selling`, hiển thị bằng `ProductCard`, có trạng thái loading/error/rỗng và link xem tất cả.
- Công việc 8 — Review (F16/F19):
  - `mvn clean test`: **20/20 pass** (11 checkout + 9 review), gồm các case đơn chưa COMPLETED, món của người khác, trùng `order_item`, trùng sản phẩm trong cùng đơn và phân trang.
  - Migration V11–V14 áp lên `ecommerce_db`: bảng `reviews` có 2 unique key, FULLTEXT `ft_products_name`, 3 B-tree (`shop_id`, `category_id`, `status, created_at`), 2 trigger `sold_count`; đã backfill `sold_count` từ đơn COMPLETED.
  - E2E API: buyer demo mua sản phẩm 5, chuyển đơn sang `COMPLETED` → `sold_count` 0 → 1; gửi review 5 sao → `rating_avg=5.0`, `rating_count=1`; gửi lại trả **409 / 1163**; chuyển đơn rời COMPLETED rồi trở lại → `sold_count` trừ/cộng đúng.
  - E2E UI (Chrome headless): form chọn sao + nhận xét hiển thị đúng, gửi thành công, danh sách review xuất hiện và điểm trung bình cập nhật ngay nhờ invalidate `['product', id]`; avatar lỗi có fallback chữ cái đầu.
- Admin/Seller/OAuth2 (2026-10-24):
  - `mvn test`: **29/29 pass** (11 checkout + 9 review + 5 admin + 4 seller), gồm test lọc người dùng cũ có `role = NULL`.
  - E2E API trên backend mới: admin dashboard/đơn toàn sàn/người dùng, khoá rồi mở khoá user; seller dashboard/đơn/chi tiết; luồng `PENDING → CONFIRMED → SHIPPING → DELIVERED → COMPLETED`, chuyển trạng thái sai trả 400.
  - Giỏ hàng: thêm → sửa số lượng → xoá qua API thật; checkout tạo order shop 10 rồi seller xử lý đến `COMPLETED`.
  - Cài đặt shop `PUT /api/shops/me` giữ nguyên trạng thái duyệt và đồng bộ tên shop sang sản phẩm.
  - OAuth2 trả 302 sang Google/Facebook với redirect URI `/login/oauth2/code/{provider}`; chưa thể đăng nhập thật vì credential còn là dummy.
  - `npm run build` pass; ESLint pass (đã sửa lỗi `set-state-in-effect` ở `routes/products/index.jsx` bằng draft state).
- Thanh toán & đơn hàng Buyer (2026-11-05):
  - `mvn test`: **38/38 pass** (11 checkout + 7 payment + 2 buyer order + 9 review + 5 admin + 4 seller).
  - E2E MySQL + backend thật với credential VNPay giả: **30/30 kiểm tra pass** — tạo URL, IPN hợp lệ, IPN gọi lặp idempotent, sai chữ ký trả 97, sai amount bị chặn, MoMo chưa cấu hình trả 503/1180, sai provider trả 1183, Buyer xem/lọc đơn và bị chặn 404 khi xem đơn người khác.
  - `npm run lint` pass; `npm run build` pass (2.319 module, 768 ms).
  - Trang `/orders` + `/orders/{id}` hiển thị danh sách, timeline, địa chỉ snapshot, trạng thái thanh toán và nút thanh toán lại.
- Chuẩn bị DB demo (2026-11-05): backup `ecommerce_db` trước khi reset; reset giữ schema + 36 categories; chạy `seed-demo.mjs` rồi `seed-large-demo.mjs` tạo **300 sản phẩm, 18 shop (15 APPROVED, 3 PENDING), 29 tài khoản, 230 đơn, 229 payment, 66 review, 300 ảnh**. Kiểm tra toàn vẹn: 0 lỗi variant, tổng đơn/session/payment, `sold_count`, `rating_count`. Admin dashboard hiển thị 230 đơn / 45 chờ xác nhận / 47 hoàn tất / 3 shop chờ duyệt; `buyer.demo` có 29 đơn (3 trang), seller Tech Zone có 24 sản phẩm / 19 đơn. API trả 300 sản phẩm (15 trang, size 20); UI `/products` 25 trang (size 12).

### 8.2 Lỗi tồn đọng ngoài phạm vi 4 gói

- Chưa có credential sandbox VNPay/MoMo và Google/Facebook, nên chưa thể kiểm thử giao dịch thanh toán/OAuth2 thật. Test payment dùng credential giả trên H2, không gọi mạng.
- `Payment` chưa lưu mã tham chiếu `orderId`/`vnp_TxnRef` của từng lần thử. Nếu callback của một lần thử cũ đến muộn, payment mới có thể bị đánh dấu `FAILED`. Trong phạm vi đồ án, rủi ro này được chấp nhận; hướng khắc phục là thêm cột `provider_reference` và đối chiếu trước khi đổi trạng thái.
- Trang kết quả thanh toán chưa tự động polling trạng thái; người dùng cần tải lại trang sau khi cổng thanh toán redirect về (return URL đã redirect về đúng trang kết quả).



