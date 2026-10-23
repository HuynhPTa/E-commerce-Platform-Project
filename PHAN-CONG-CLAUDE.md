# Phân công 4 phiên Claude — Công việc 3 và Công việc 5

Phạm vi: chỉ **Công việc 3** (Product + Variant + Ảnh — F7, F8) và **Công việc 5** (Checkout tách đơn — F12).
Các việc khác (VNPay/MoMo, order tracking, review, dashboard...) **chưa làm** ở đợt này.

Nhánh nền: `dev-huynh` (commit mới nhất tại thời điểm chia việc).

## 1. Hiện trạng (đã đối chiếu với code)

### Công việc 3 — Product + Variant + Ảnh
| Hạng mục | Tình trạng |
|---|---|
| Entity `Product`, `ProductVariant`; `GET /api/products` (search/lọc/phân trang), `GET /api/products/{id}` | ✅ Có |
| FE: `routes/products/index.jsx`, `$productId.jsx`, `ProductCard`, `VariantSelector` | ✅ Có |
| Entity/bảng/migration `product_images` | ❌ Chưa có |
| API upload & lưu ảnh sản phẩm | ❌ Chưa có (`WebConfig` chưa xử lý ảnh sản phẩm) |
| API CRUD sản phẩm cho Seller (POST/PUT/DELETE, kiểm tra `shop.user_id == currentUser.id`) | ❌ Chưa có — `ProductController` mới chỉ có 2 GET |
| CRUD variant; luôn có ≥ 1 variant mặc định khi tạo sản phẩm | ❌ Chưa có |
| FE: form CRUD sản phẩm cho Seller + upload ảnh (`routes/seller/products`) | ❌ Chưa có (seller mới có `dashboard`, `layout`, `register`) |

=> Báo cáo ghi F7 "Hoàn thành" là **chưa đúng**: mới xong phần đọc (F8), thiếu toàn bộ phần ghi của Seller.

### Công việc 5 — Checkout (F12)
| Hạng mục | Tình trạng |
|---|---|
| `CheckoutService` (`@Transactional`): nhóm theo shop → 1 `checkout_sessions` + N `orders` + `order_items`; snapshot địa chỉ JSON; trừ kho nguyên tử có sắp xếp theo `variantId`; xóa `cart_items` | ✅ Có code |
| `CheckoutController`: `POST /api/checkout`, `GET /api/checkout/{id}` | ✅ Có |
| Migration `V9__create_checkout_orders_payments.sql` (có dữ liệu seed) | ✅ Có |
| FE `routes/checkout.jsx` + `ShopGroup` + Zod schema + tự điền địa chỉ mặc định | ✅ Có |
| Test (race-condition, rollback toàn bộ khi hết hàng) | ❌ Chưa có — không có thư mục `Backend/src/test` |
| Rà soát/chạy thử thực tế end-to-end, sửa lỗi phát sinh | ⬜ Chưa xác nhận |
| Bước sau đặt hàng thành công (điều hướng, màn hình kết quả) | ⬜ Cần rà; thanh toán thật (F13/F14) **không** làm ở đợt này |

## 2. Chia việc đều: 4 gói / 4 phiên Claude

| Gói | Phiên | Công việc | Nhánh |
|---|---|---|---|
| **A** | Claude 1 | Job 3 — **Backend** | `feat/job3-be-seller-products` |
| **B** | Claude 2 | Job 3 — **Frontend** | `feat/job3-fe-seller-products` |
| **C** | Claude 3 | Job 5 — **Backend** (rà soát + test) | `feat/job5-be-checkout-tests` |
| **D** | Claude 4 | Job 5 — **Frontend** (rà soát + hoàn thiện) | `feat/job5-fe-checkout` |

Mỗi gói tương đương một lượng việc vừa phải, nên token dùng đều nhau.

## 3. Quy tắc chung (để 4 phiên không đè code nhau)

1. Tạo nhánh riêng từ `dev-huynh` mới nhất, **không** commit thẳng vào `dev-huynh`/`main`.
2. Chỉ sửa file thuộc gói của mình. File dùng chung — `ErrorCode.java`, `SecurityConfig.java`, `routeTree.gen.*`/router, `SiteHeader.jsx`, `PanelLayout.jsx` — chỉ thêm vào cuối hoặc thêm một khối riêng, không sắp xếp lại, không format lại cả file.
3. Mã lỗi mới trong `ErrorCode`: gói A dùng dải **1100–1149**, gói C dùng dải **1150–1199**.
4. Migration: nếu dự án dùng Flyway thì gói A dùng **V10** (bảng `product_images`). Các gói khác không tạo migration mới nếu không cần; nếu cần thì hỏi trước. Kiểm tra `application.properties.example` xem dự án đang dùng Flyway hay `ddl-auto` để làm đúng quy ước.
5. Commit nhỏ, message rõ ràng. Xong thì mở Pull Request vào `dev-huynh`, mô tả đã làm gì và đã test gì.
6. Thứ tự gộp: A → B, C → D (BE gộp trước FE). Sau cùng cập nhật roadmap.
7. Không bịa dữ liệu: nếu thấy chỗ nào khác với mô tả trong file này, tin code thật và ghi chú lại trong PR.

## 4. Hợp đồng API Job 3 (để A và B làm song song)

Đây là đề xuất khởi điểm. **Claude 1 (gói A) phải commit file `docs/api-seller-products.md` chốt bản cuối trong lượt làm đầu tiên**; Claude 2 (gói B) đối chiếu theo file đó. Tên trường phải khớp với `Product`/`ProductResponse` hiện có (đọc code trước khi chốt).

Tất cả endpoint dưới đây yêu cầu đăng nhập, và người gọi phải là chủ shop (`shop.user_id == currentUser.id`) của sản phẩm tương ứng.

| Method | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/api/seller/products` | Tạo sản phẩm. Body: `name`, `description`, `categoryId`, danh sách `variants` (`sku`, `attributes`, `priceMinor`, `stockQuantity`). Nếu không gửi variant thì BE tự tạo 1 variant mặc định. |
| GET | `/api/seller/products` | Danh sách sản phẩm của shop mình, có phân trang |
| PUT | `/api/seller/products/{id}` | Sửa thông tin sản phẩm |
| DELETE | `/api/seller/products/{id}` | Ẩn/xóa mềm sản phẩm (không xóa cứng nếu đã có đơn) |
| POST | `/api/seller/products/{id}/variants` | Thêm variant |
| PUT / DELETE | `/api/seller/products/{id}/variants/{variantId}` | Sửa / xóa variant (không cho xóa variant cuối cùng) |
| POST | `/api/seller/products/{id}/images` | Upload ảnh (`multipart/form-data`, trường `file`), trả về `id`, `url`, `sortOrder` |
| DELETE | `/api/seller/products/{id}/images/{imageId}` | Xóa ảnh |

`GET /api/products/{id}` (công khai) bổ sung danh sách `images`.

## 5. Prompt dán sẵn cho từng phiên Claude

Mỗi phiên cần có quyền truy cập repo `HuynhPTa/E-commerce-Platform-Project` (liên kết GitHub + cài Claude GitHub App cho repo) thì mới push được.

### Gói A — Claude 1: Job 3 Backend

```
Repo: HuynhPTa/E-commerce-Platform-Project, nhánh nền dev-huynh. Đọc PHAN-CONG-CLAUDE.md ở gốc repo trước.
Bạn là gói A. Tạo nhánh feat/job3-be-seller-products từ dev-huynh.
Nhiệm vụ (Backend, Spring Boot 3.3):
1. Đọc entity Product/ProductVariant, ProductService, ProductResponse, SecurityConfig, ShopService hiện có.
2. Thêm entity + repository ProductImage (và migration V10 nếu dự án dùng Flyway).
3. Làm bộ API seller theo mục 4 của PHAN-CONG-CLAUDE.md: CRUD sản phẩm, CRUD variant, upload/xóa ảnh. Kiểm tra shop.user_id == currentUser.id; mỗi sản phẩm luôn có >= 1 variant mặc định; không xóa variant cuối cùng.
4. Lưu ảnh vào thư mục upload cục bộ phục vụ qua WebConfig (giới hạn loại file image/*, dung lượng tối đa).
5. Mở rộng GET /api/products/{id} trả thêm images.
6. Việc ĐẦU TIÊN: commit docs/api-seller-products.md chốt hợp đồng API (tên trường, mã lỗi, ví dụ JSON) để gói B đọc.
7. Mã lỗi mới dùng dải 1100–1149 trong ErrorCode. Chỉ sửa file thuộc phạm vi này.
8. Thêm test cho quy tắc quyền sở hữu và variant mặc định nếu có thể. Mở PR vào dev-huynh khi xong.
```

### Gói B — Claude 2: Job 3 Frontend

```
Repo: HuynhPTa/E-commerce-Platform-Project, nhánh nền dev-huynh. Đọc PHAN-CONG-CLAUDE.md ở gốc repo trước.
Bạn là gói B. Tạo nhánh feat/job3-fe-seller-products từ dev-huynh.
Nhiệm vụ (Frontend React 19 + TanStack + React Hook Form + Zod):
1. Đọc Frontend/src/routes/seller, routes/products, components/product/VariantSelector.jsx, api/product.api.js, queries/useProducts.js.
2. Làm trang quản lý sản phẩm cho Seller: danh sách sản phẩm của shop, form tạo/sửa (RHF + Zod), quản lý variant (thêm/sửa/xóa), upload ảnh nhiều file có xem trước, xóa ảnh.
3. Thêm api/seller-product.api.js và hooks TanStack Query; invalidate ['products'] và ['seller','products'] sau mỗi mutation. Không dùng optimistic update cho thao tác upload.
4. Route mới đặt dưới routes/seller/products (lazy load như seller/dashboard hiện có).
5. Hợp đồng API: đọc docs/api-seller-products.md do gói A commit (nếu chưa có thì dùng mục 4 của PHAN-CONG-CLAUDE.md và ghi chú chỗ cần khớp lại).
6. Trang chi tiết sản phẩm của người mua hiển thị thêm bộ ảnh nếu API đã trả images.
7. Chỉ sửa file thuộc phạm vi này; file dùng chung chỉ thêm khối mới. Mở PR vào dev-huynh khi xong.
```

### Gói C — Claude 3: Job 5 Backend

```
Repo: HuynhPTa/E-commerce-Platform-Project, nhánh nền dev-huynh. Đọc PHAN-CONG-CLAUDE.md ở gốc repo trước.
Bạn là gói C. Tạo nhánh feat/job5-be-checkout-tests từ dev-huynh.
Nhiệm vụ (Backend, checkout tách đơn F12 — code đã có một phần):
1. Rà soát CheckoutService, CheckoutController, CheckoutCartRepository, CheckoutRequest/Response, entity Order/OrderItem/CheckoutSession, migration V9. Tìm lỗi logic, thiếu ràng buộc, rủi ro tràn số (tiền đang dùng int), shop bị khóa/chưa duyệt, sản phẩm không ACTIVE, giỏ rỗng, cartItemIds của người khác.
2. Sửa lỗi tìm thấy (sửa tối thiểu, không đổi hợp đồng API đang dùng bởi FE; nếu buộc phải đổi thì ghi rõ trong PR để gói D biết).
3. Viết test (thư mục Backend/src/test chưa có — thêm cấu hình test nếu cần): checkout 1 shop, checkout nhiều shop tạo đúng N đơn, rollback toàn bộ khi một món hết hàng (kho các món trước phải được hoàn lại), 2 giao dịch đồng thời cùng mua món cuối cùng chỉ 1 giao dịch thành công, người mua không xem được phiên của người khác.
4. Mã lỗi mới dùng dải 1150–1199 trong ErrorCode. Không làm thanh toán VNPay/MoMo.
5. Mở PR vào dev-huynh, nêu rõ test đã chạy và kết quả.
```

### Gói D — Claude 4: Job 5 Frontend

```
Repo: HuynhPTa/E-commerce-Platform-Project, nhánh nền dev-huynh. Đọc PHAN-CONG-CLAUDE.md ở gốc repo trước.
Bạn là gói D. Tạo nhánh feat/job5-fe-checkout từ dev-huynh.
Nhiệm vụ (Frontend, trang /checkout F12 — code đã có một phần):
1. Rà soát routes/checkout.jsx, components/checkout/ShopGroup.jsx, schemas/checkout.schema.js, queries/useCheckout.js, api/checkout.api.js, lib/cartUtils.
2. Hoàn thiện: gom nhóm theo shop, chọn lại địa chỉ đã lưu (useAddresses), form RHF + Zod khớp CheckoutRequest.java, chọn cổng thanh toán, khóa nút khi đang gửi hoặc còn món optimistic 'tmp-', hiển thị lỗi từ BE (hết hàng, sản phẩm không còn bán) rõ ràng, giỏ trống thì có thông báo.
3. KHÔNG dùng optimistic update cho checkout. Sau khi đặt hàng thành công: invalidate ['cart'] và hiển thị màn hình kết quả đọc dữ liệu thật từ GET /api/checkout/{id} (không tin tham số URL). Thanh toán thật VNPay/MoMo chưa làm ở đợt này; chỉ chừa chỗ gọi tiếp theo.
4. Chạy lint/build Frontend và sửa lỗi liên quan phạm vi của bạn. Chỉ sửa file thuộc phạm vi này. Mở PR vào dev-huynh khi xong.
```

## 6. Sau khi cả 4 PR xong

- Gộp theo thứ tự A → B, C → D vào `dev-huynh`, chạy thử end-to-end (Seller tạo sản phẩm có ảnh → Buyer thêm vào giỏ → checkout nhiều shop).
- Cập nhật `roadmap-ecommerce-full.md`: đổi F7 và F12 sang trạng thái thực tế, ghi các phần còn lại.
