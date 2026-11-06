# MarketHub Storefront

Bản React của giao diện single-store mới trong `design/prototype`.

## Chạy

Từ thư mục `Frontend`:

```bash
npm run dev:storefront
```

Storefront chạy ở `http://localhost:5173`, dùng chung backend `http://localhost:8080/api`.
Nếu app React cũ cũng đang chạy ở cổng 5173, tắt app cũ trước.

## Build

```bash
npm run build:storefront
```

Kết quả nằm trong `Frontend/dist-storefront`.

## Đã chuyển

- Header, announcement bar, footer dùng chung.
- Trang danh sách sản phẩm:
  - Dữ liệu thật từ `GET /api/products` và `GET /api/categories`.
  - Lọc theo danh mục, khoảng giá.
  - Sắp xếp mới nhất, bán chạy, giá tăng/giảm.
  - Phân trang 12 sản phẩm mỗi trang.
  - Tìm kiếm theo từ khoá.
  - Thêm nhanh vào giỏ hàng khi đã đăng nhập.
- Trang chi tiết sản phẩm:
  - Dữ liệu thật từ `GET /api/products/{id}`.
  - Gallery ảnh, chọn phiên bản theo thuộc tính, giá và tồn kho theo phiên bản.
  - Chọn số lượng, thêm vào giỏ, mua ngay.
  - Mô tả, thông số, đánh giá thật từ `GET /api/products/{id}/reviews`.
  - Sản phẩm liên quan theo danh mục gốc.
- Trang đăng nhập:
  - Gọi `POST /api/auth/login`, lưu JWT và thông tin người dùng.
  - Header đổi giữa Đăng nhập và tên người dùng/Đăng xuất.
  - Hỗ trợ quay lại trang trước bằng tham số `redirect`.
- Trang đăng ký:
  - Gọi `POST /api/auth/register`, sau đó chuyển về trang đăng nhập.
  - Kiểm tra họ tên, email, số điện thoại và độ dài mật khẩu.
- Trang giỏ hàng:
  - Dữ liệu thật từ `GET /api/cart`.
  - Chọn từng mặt hàng bằng checkbox; không tự chọn tất cả khi mở trang.
  - Cập nhật số lượng bằng `PUT /api/cart/{itemId}`, giới hạn theo tồn kho.
  - Mỗi lần bấm tăng/giảm chỉ gửi một yêu cầu; bấm nhanh liên tiếp không làm số lượng nhảy sai.
  - Xoá mặt hàng bằng `DELETE /api/cart/{itemId}`.
  - Tạm tính, tiến độ miễn phí giao hàng và tổng cộng tính từ các mặt hàng đã chọn.
- Trang thanh toán:
  - Địa chỉ thật từ `GET /api/addresses`; chọn địa chỉ đã lưu hoặc nhập địa chỉ mới.
  - Chọn tỉnh/thành; phí giao hàng do backend tính: miễn phí từ 499.000₫, dưới ngưỡng miền Nam 0₫, miền Trung 10.000₫, miền Bắc 20.000₫.
  - Chọn COD hoặc VNPay/MoMo; tạo đơn qua `POST /api/checkout`.
  - Mỗi lần mở trang giữ một `idempotencyKey`; thử lại sau lỗi mạng không tạo trùng đơn.
  - Chuyển sang “nhập địa chỉ mới” xoá người nhận, số điện thoại, địa chỉ và tỉnh/thành; đổi tài khoản cũng đặt lại biểu mẫu.
  - Với cổng trực tuyến, tạo URL thanh toán qua `POST /api/payments/create-url`; nếu chưa cấu hình, chuyển tới trang kết quả và giữ đơn để thanh toán lại.
- Trang kết quả thanh toán:
  - Đọc phiên thật qua `GET /api/checkout/{checkoutId}`.
  - Hiển thị các đơn trong phiên, trạng thái và tổng tiền; hỗ trợ thanh toán lại cho đơn trả trước còn hiệu lực.
  - Đơn COD hiển thị “Thanh toán khi nhận hàng”, không nhắc thanh toán trực tuyến và không có nút thanh toán lại.
  - Phiên đã huỷ hiển thị “Đơn hàng đã bị huỷ”, tổng 0₫ và không có nút thanh toán lại.
  - Giao dịch `REFUND_REQUIRED` hiển thị nhãn “Cần hoàn tiền”.
- Trang đơn hàng:
  - Gọi `GET /api/orders?page&size&status`; lọc theo trạng thái, 5 đơn mỗi trang.
  - Mỗi thẻ có tối đa hai mặt hàng xem trước, tổng tiền và trạng thái thật.
- Trang chi tiết đơn hàng:
  - Gọi `GET /api/orders/{orderId}`; timeline 5 bước, danh sách mặt hàng, địa chỉ snapshot, tổng tiền và trạng thái thanh toán.
  - Đơn `PENDING` chưa thanh toán trực tuyến có liên kết thanh toán lại; đơn COD không hiển thị lời nhắc này.
  - Huỷ đơn `PENDING`/`CONFIRMED` khi chưa thanh toán trực tuyến thành công, có hộp thoại xác nhận.
  - Sửa người nhận, số điện thoại, địa chỉ và tỉnh/thành khi đơn còn `PENDING`; phí giao hàng được tính lại.
- Trang tài khoản:
  - Gọi `GET/PUT /api/me`; cập nhật họ tên, số điện thoại, ngày sinh và đồng bộ tên trên header.
  - Thêm, sửa, xoá địa chỉ qua `/api/addresses`; đặt mặc định qua `PUT /api/addresses/{id}/default`.
  - Đăng xuất ngay trong trang tài khoản.

## Phiên đăng nhập

- Đăng nhập, đăng xuất hoặc nhận `401` đều xoá toàn bộ dữ liệu truy vấn đã cache, nên hồ sơ, địa chỉ, đơn hàng và giỏ của tài khoản cũ không bị dùng lại.
- Khi token hết hạn hoặc không hợp lệ, storefront xoá toàn bộ khoá xác thực trong `localStorage` và đưa header về trạng thái “Đăng nhập”.
