# Hợp đồng API — Seller Products (Job 3, Backend)

Tài liệu này chốt hợp đồng giữa gói **A (Backend)** và gói **B (Frontend)** cho Công việc 3
(Product + Variant + Ảnh). Bản cuối cùng do gói A commit trước khi code.

- Base URL: `http://localhost:8080`
- Prefix API: `/api`
- Tất cả endpoint dưới đây **yêu cầu đăng nhập** (`Authorization: Bearer <access_token>`).
- Người gọi phải là **chủ shop** của sản phẩm: `shop.user_id == currentUser.id`.
  Nếu tài khoản chưa có shop → lỗi `1050` (`SHOP_NOT_EXISTED`).
  Nếu sản phẩm thuộc shop khác → lỗi `1101` (`PRODUCT_NOT_OWNED`, HTTP 403).
- Response bọc trong envelope chung của dự án:

```json
{ "code": 1000, "message": null, "result": {} }
```

- Lỗi trả về:

```json
{ "code": 1100, "message": "Sản phẩm không tồn tại" }
```

---

## 1. Kiểu dữ liệu dùng chung

### `ProductVariantResponse`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | number | |
| `sku` | string \| null | duy nhất toàn hệ thống (không phân biệt hoa/thường) |
| `attributes` | object\<string,string\> | vd `{ "color": "Đen", "size": "L" }`; có thể `{}` |
| `priceMinor` | number | giá theo đơn vị nhỏ nhất (VND, không nhân 100) |
| `stockQuantity` | number | |
| `imageUrl` | string \| null | |

### `ProductImageResponse`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | number | |
| `url` | string | **URL tuyệt đối** (bắt đầu bằng `http://...`), FE dùng trực tiếp trong `<img src>` |
| `sortOrder` | number | 0, 1, 2... |

### `SellerProductResponse`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | number | |
| `name` | string | |
| `description` | string \| null | |
| `categoryId` | string | id danh mục (dạng chuỗi) |
| `categoryName` | string \| null | |
| `shopId` | string | id shop (dạng chuỗi, khớp `Product.shopId`) |
| `shopName` | string | |
| `thumbnailUrl` | string \| null | |
| `status` | string | `ACTIVE` hoặc `DELETED` |
| `ratingAvg` | number | |
| `ratingCount` | number | |
| `soldCount` | number | |
| `createdAt` | string (ISO-8601) | |
| `variants` | `ProductVariantResponse[]` | luôn có **≥ 1** phần tử |
| `images` | `ProductImageResponse[]` | sắp theo `sortOrder` tăng dần |

### `PageResponse<T>`

```json
{ "items": [], "page": 1, "size": 12, "totalItems": 0, "totalPages": 0 }
```

---

## 2. Danh sách endpoint

| Method | Đường dẫn | Mô tả |
|---|---|---|
| `POST` | `/api/seller/products` | Tạo sản phẩm (kèm variants tuỳ chọn) |
| `GET` | `/api/seller/products` | Danh sách sản phẩm của shop mình (phân trang, tìm kiếm) |
| `GET` | `/api/seller/products/{id}` | Chi tiết 1 sản phẩm của shop mình |
| `PUT` | `/api/seller/products/{id}` | Sửa thông tin sản phẩm |
| `DELETE` | `/api/seller/products/{id}` | Xoá mềm sản phẩm |
| `POST` | `/api/seller/products/{id}/variants` | Thêm variant |
| `PUT` | `/api/seller/products/{id}/variants/{variantId}` | Sửa variant |
| `DELETE` | `/api/seller/products/{id}/variants/{variantId}` | Xoá variant |
| `POST` | `/api/seller/products/{id}/images` | Upload 1 ảnh (`multipart/form-data`, trường `file`) |
| `DELETE` | `/api/seller/products/{id}/images/{imageId}` | Xoá ảnh |

`GET /api/products/{id}` (công khai, phía người mua) được bổ sung trường `images`
(cùng kiểu `ProductImageResponse[]`). Các trường cũ giữ nguyên.

---

## 3. Chi tiết từng endpoint

### 3.1. `POST /api/seller/products`

Body (`application/json`):

```json
{
  "name": "Áo thun nam basic cotton",
  "description": "Chất liệu cotton 100%",
  "categoryId": "12",
  "variants": [
    {
      "sku": "AO-DEN-L",
      "attributes": { "color": "Đen", "size": "L" },
      "priceMinor": 250000,
      "stockQuantity": 20,
      "imageUrl": null
    }
  ]
}
```

- `name`: bắt buộc, 1–200 ký tự.
- `categoryId`: bắt buộc; nhận **id số** hoặc **slug** danh mục đã tồn tại.
  BE lưu lại dưới dạng id (chuỗi). Danh mục không tồn tại → `1040`.
- `description`: tuỳ chọn, tối đa 5000 ký tự.
- `variants`: tuỳ chọn. Nếu **không gửi** hoặc gửi mảng rỗng → BE tự tạo 1 variant mặc định:
  - `sku` = `"DEFAULT-<productId>"`, `attributes` = `{}`, `priceMinor` = 0, `stockQuantity` = 0.
- Nếu `variants` có phần tử: `priceMinor >= 0`, `stockQuantity >= 0`, `sku` (nếu có)
  không được trùng với SKU đã tồn tại → `1104`.
- `status` của sản phẩm mới = `ACTIVE`; `shopId`/`shopName` lấy từ shop của người gọi.

Response `201` (envelope `code = 1000`), `result` = `SellerProductResponse`.

### 3.2. `GET /api/seller/products`

Query params:

| Param | Mặc định | Ghi chú |
|---|---|---|
| `page` | `1` | 1-based |
| `size` | `12` | tối đa 50 |
| `q` | — | tìm theo tên (không phân biệt hoa/thường) |
| `status` | — | `ACTIVE` \| `DELETED`. Bỏ trống = tất cả **trừ** `DELETED` |

Response `result` = `PageResponse<SellerProductResponse>`.

### 3.3. `GET /api/seller/products/{id}`

Response `result` = `SellerProductResponse`. Sản phẩm `DELETED` vẫn xem được (để FE hiển thị
trạng thái), nhưng mọi thao tác sửa/xoá/upload lên sản phẩm `DELETED` đều trả `1100`.

### 3.4. `PUT /api/seller/products/{id}`

Body:

```json
{
  "name": "Áo thun nam basic cotton (mới)",
  "description": "Cập nhật mô tả",
  "categoryId": "12"
}
```

- Chỉ sửa thông tin sản phẩm. **Không** sửa variant ở endpoint này — dùng các endpoint variant.
- `name` và `categoryId` bắt buộc.

Response `result` = `SellerProductResponse`.

### 3.5. `DELETE /api/seller/products/{id}`

- Xoá **mềm**: đặt `status = "DELETED"`. Không xoá cứng vì sản phẩm có thể đã nằm trong đơn hàng.
- Sản phẩm `DELETED` không còn xuất hiện ở `GET /api/products` và không thể thêm vào giỏ.
- Gọi lại lần 2 → `1100`.

Response `result` = `null`, `message = "Đã xoá sản phẩm"`.

### 3.6. `POST /api/seller/products/{id}/variants`

Body:

```json
{
  "sku": "AO-TRANG-M",
  "attributes": { "color": "Trắng", "size": "M" },
  "priceMinor": 260000,
  "stockQuantity": 15,
  "imageUrl": null
}
```

- `priceMinor` bắt buộc, `>= 0`; `stockQuantity` bắt buộc, `>= 0`.
- `sku` tuỳ chọn nhưng phải duy nhất (`1104`).

Response `result` = `ProductVariantResponse`.

### 3.7. `PUT /api/seller/products/{id}/variants/{variantId}`

Body giống mục 3.6. Đây là **cập nhật toàn phần** (full replace):

- `priceMinor`, `stockQuantity`: bắt buộc.
- `sku` / `imageUrl`: gửi `null` để xoá giá trị.
- `attributes`: gửi `null` → `{}` (không giữ giá trị cũ).

Response `result` = `ProductVariantResponse`.

### 3.8. `DELETE /api/seller/products/{id}/variants/{variantId}`

- Không cho xoá variant **cuối cùng** của sản phẩm → `1103`.
- Không cho xoá variant đã xuất hiện trong đơn hàng (`order_items`) → `1105`.
- Variant đang nằm trong giỏ hàng của người mua sẽ bị **gỡ khỏi giỏ** khi xoá.

Response `result` = `null`, `message = "Đã xoá biến thể"`.

### 3.9. `POST /api/seller/products/{id}/images`

`Content-Type: multipart/form-data`, một file:

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `file` | file | bắt buộc |

Giới hạn:

- Chỉ nhận `image/jpeg`, `image/png`, `image/webp`, `image/gif` (kiểm tra cả `Content-Type`
  và phần mở rộng file) → sai loại: `1108`.
- Tối đa **5 MB** / file → quá lớn: `1109`.
- Tối đa **10 ảnh** / sản phẩm → vượt: `1107`.

Cách lưu: file được đổi tên bằng UUID, lưu tại thư mục cấu hình
`app.upload.product-images-dir` (mặc định `uploads/product-images`), phục vụ qua
`GET /uploads/product-images/<tên-file>` (công khai, không cần token).
DB lưu đường dẫn tương đối `/uploads/product-images/<tên-file>`; API luôn trả URL tuyệt đối.

Nếu sản phẩm chưa có `thumbnailUrl`, ảnh đầu tiên upload lên sẽ tự trở thành thumbnail.

Response `201`, `result` = `ProductImageResponse`.

Ví dụ gọi:

```bash
curl -X POST "http://localhost:8080/api/seller/products/1/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@ao-thun.jpg"
```

### 3.10. `DELETE /api/seller/products/{id}/images/{imageId}`

- Xoá bản ghi ảnh và file trên đĩa.
- Nếu ảnh đang là thumbnail, `thumbnailUrl` chuyển sang ảnh còn lại có `sortOrder` nhỏ nhất
  (hoặc `null` nếu hết ảnh).

Response `result` = `null`, `message = "Đã xoá ảnh"`.

---

## 4. Mã lỗi mới (dải 1100–1149)

| Code | Enum | HTTP | Message |
|---|---|---|---|
| 1100 | `PRODUCT_NOT_EXISTED` | 404 | Sản phẩm không tồn tại |
| 1101 | `PRODUCT_NOT_OWNED` | 403 | Bạn không có quyền quản lý sản phẩm này |
| 1102 | `VARIANT_NOT_EXISTED` | 404 | Biến thể sản phẩm không tồn tại |
| 1103 | `LAST_VARIANT_DELETE_NOT_ALLOWED` | 400 | Không thể xoá biến thể cuối cùng của sản phẩm |
| 1104 | `VARIANT_SKU_EXISTED` | 409 | SKU biến thể đã tồn tại |
| 1105 | `VARIANT_IN_USE` | 409 | Biến thể đã có trong đơn hàng, không thể xoá |
| 1106 | `PRODUCT_IMAGE_NOT_EXISTED` | 404 | Ảnh sản phẩm không tồn tại |
| 1107 | `PRODUCT_IMAGE_LIMIT_EXCEEDED` | 400 | Mỗi sản phẩm chỉ được tối đa 10 ảnh |
| 1108 | `PRODUCT_IMAGE_INVALID_TYPE` | 400 | Chỉ chấp nhận file ảnh JPEG, PNG, WEBP hoặc GIF |
| 1109 | `PRODUCT_IMAGE_TOO_LARGE` | 400 | Ảnh vượt quá dung lượng cho phép (5 MB) |
| 1110 | `PRODUCT_IMAGE_UPLOAD_FAILED` | 500 | Lưu ảnh thất bại, vui lòng thử lại |

Lỗi dùng lại từ module khác: `1032` `INVALID_INPUT` (dữ liệu sai), `1040` `CATEGORY_NOT_EXISTED`,
`1050` `SHOP_NOT_EXISTED`.

---

## 5. Ví dụ luồng đầy đủ

```text
1. POST /api/seller/products                      -> tạo SP + 1 variant mặc định
2. POST /api/seller/products/{id}/variants        -> thêm variant thật (SKU, giá, kho)
3. PUT  /api/seller/products/{id}                 -> cập nhật tên/mô tả/danh mục
4. POST /api/seller/products/{id}/images (x N)    -> upload ảnh, ảnh đầu thành thumbnail
5. GET  /api/seller/products?page=1&size=12       -> danh sách SP của shop
6. GET  /api/products/{id}                        -> người mua xem SP kèm images
7. DELETE /api/seller/products/{id}               -> xoá mềm (status = DELETED)
```

---

## 6. Ghi chú triển khai cho gói B (Frontend)

- Dùng `apiClient` hiện có (base `/api`) cho các endpoint `/seller/products...`.
- Upload ảnh: `FormData` với key `file`; **không** tự set `Content-Type` để axios tự thêm boundary.
- `images[].url` và `thumbnailUrl` đã là URL tuyệt đối → dùng trực tiếp.
- Response lỗi luôn có `code` + `message`; hiển thị `message` cho người dùng.
- Sau mutation nên invalidate `['seller','products']` và `['products']`.
- Trước khi gọi API seller, cần đảm bảo tài khoản đã có shop (gọi `GET /api/shops/me`);
  nếu chưa có, điều hướng sang trang đăng ký shop.
