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
- **Frontend**: `queries/useCart.js` — **optimistic update thật**: UI đổi ngay khi bấm "Thêm vào giỏ", rollback nếu BE trả lỗi (vd hết hàng — `InsufficientStockException`).

### 6.7 Checkout (tách đơn theo shop)
- **Backend**: `POST /api/checkout` — logic quan trọng nhất: 1 giỏ hàng có sản phẩm từ N shop → tạo `checkout_session` + N `orders` (mỗi order 1 shop) trong **cùng 1 `@Transactional`**, đồng thời trừ `stock_quantity` (check `>= quantity` trong cùng câu lệnh update để tránh race condition).
- **Frontend**: `routes/checkout.jsx` — form địa chỉ/thanh toán dùng React Hook Form + Zod (≥4 field); mutation **không optimistic** (liên quan tiền) — chờ response thật rồi mới điều hướng sang `redirectUrl` VNPay/Momo.

### 6.8 Payment (VNPay/Momo sandbox)
- **Backend**: `PaymentGateway` interface với 2 implementation (`VnPayProvider`, `MomoProvider`); `POST` tạo URL thanh toán, endpoint IPN/callback riêng cho mỗi provider verify chữ ký (VNPay: HMAC-SHA512; Momo: HMAC-SHA256); phải **idempotent** (IPN gọi lặp không cộng tiền/trừ kho 2 lần); sau verify thành công → cập nhật `payments.status`, `orders.status=CONFIRMED`.
- **Frontend**: chọn provider ở checkout → redirect sang cổng thanh toán → trang `payment/return` đọc kết quả **từ BE** (gọi lại `useOrderQuery`), không tin param trên URL.

### 6.9 Order tracking
- **Backend**: `GET /api/orders` (buyer xem đơn của mình), `PATCH /api/orders/{id}/status` (seller cập nhật trạng thái: CONFIRMED→SHIPPING→DELIVERED).
- **Frontend**: `routes/orders/` — danh sách + chi tiết đơn, hiển thị timeline trạng thái (`components/order/OrderTimeline`).

### 6.10 Review
- **Backend**: `POST /api/reviews` — chỉ tạo được nếu `order_item` liên quan có đơn ở trạng thái `COMPLETED` (kiểm tra qua `order_item_id`, UNIQUE — chặn review khống/review nhiều lần).
- **Frontend**: `components/review/ReviewForm.jsx`, `ReviewList.jsx`, `RatingSummary.jsx`.

### 6.11 Seller Dashboard
- **Backend**: tổng hợp API cho seller: đơn hàng của shop, tồn kho theo sản phẩm, doanh thu cơ bản (tổng `total_minor` các order `COMPLETED`).
- **Frontend**: `routes/seller/dashboard.jsx` — bundle riêng, lazy-load, tách khỏi bundle Buyer.

### 6.12 Admin
- **Backend**: duyệt shop (`PATCH /api/admin/shops/{id}/status`), quản lý category, xem đơn toàn sàn.
- **Frontend**: `routes/admin/dashboard.jsx`, `shops.jsx`, `categories.jsx` — bundle riêng, lazy-load.

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
| F2 | JWT thật + `SecurityConfig` chặn 401 | BE | ⬜ Chưa |
| F3 | `useLoginMutation`, `useRegisterMutation`, invalidate `['user','me']` | FE | ✅ Xong (đang lỗi 404 do path lệch) |
| F4 | `UserController /me`; `GlobalExceptionHandler` | BE | ⬜ Chưa |
| F5 | `categories` — entity, migration, CRUD API + FE | FE+BE | ⬜ Chưa |
| F6 | `shops` — entity, migration, đăng ký shop | FE+BE | ⬜ Chưa |
| F7 | `products`+`product_variants`+`product_images` | FE+BE | ⬜ Chưa |
| F8 | Trang danh sách + chi tiết sản phẩm | FE | ⬜ Chưa (khung đã có, chờ BE) |
| F9 | Tìm kiếm + lọc + phân trang | FE+BE | ⬜ Chưa (validateSearch đã có ở FE) |
| F10 | `cart_items` — optimistic mutation | FE+BE | ⬜ Chưa (hook FE đã có, chờ BE) |
| F11 | `addresses` | FE+BE | ⬜ Chưa |
| F12 | `checkout_sessions`+`orders`+`order_items` trong `@Transactional` | BE | ⬜ Chưa |
| F13 | VNPay sandbox | BE+FE | ⬜ Chưa |
| F14 | Momo sandbox | BE+FE | ⬜ Chưa |
| F15 | Theo dõi & cập nhật trạng thái đơn | FE+BE | ⬜ Chưa |
| F16 | `reviews` | FE+BE | ⬜ Chưa |
| F17 | Seller Dashboard | FE+BE | ⬜ Chưa (khung route đã có) |
| F18 | Admin | FE+BE | ⬜ Chưa (khung route đã có) |
| F19 | Index DB | BE | ⬜ Chưa |
| F20 | Code splitting/Profiler | FE | ✅ Đã tách bundle seller/admin |
| F21 | Test checkout nhiều shop + webhook | FE+BE | ⬜ Chưa |
| F22 | Build production, polish, demo | FE+BE | ⬜ Chưa |

**Việc cần làm ngay** (đang chặn tiến độ): sửa lỗi 404 ở `/register` (đối chiếu path FE `api/auth.api.js` với `@RequestMapping` thật trong `AuthenticationController`), sau đó làm F2 (SecurityConfig+JWT) và F4 (`/me`) để hoàn thiện toàn bộ luồng Auth trước khi sang F5.
