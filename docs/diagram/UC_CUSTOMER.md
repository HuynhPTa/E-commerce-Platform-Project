# Use Case — Khách hàng (Customer)

Khách hàng là người đã đăng nhập. Ngoài các use case xem sản phẩm dùng chung **UC01–UC06**, Khách hàng có các use case sau:

| Mã | Tên Use Case | Tác nhân |
|---|---|---|
| UC08 | Đăng nhập | Khách hàng |
| UC09 | Đăng nhập bằng Google/Facebook | Khách hàng |
| UC10 | Đăng xuất | Khách hàng |
| UC11 | Xem và cập nhật hồ sơ cá nhân | Khách hàng |
| UC12 | Quản lý địa chỉ nhận hàng | Khách hàng |
| UC13 | Xem giỏ hàng | Khách hàng |
| UC14 | Thêm sản phẩm vào giỏ hàng | Khách hàng |
| UC15 | Cập nhật số lượng sản phẩm trong giỏ hàng | Khách hàng |
| UC16 | Xoá sản phẩm khỏi giỏ hàng | Khách hàng |
| UC17 | Mua ngay | Khách hàng |
| UC18 | Đặt hàng | Khách hàng |
| UC19 | Thanh toán qua VNPay/MoMo | Khách hàng |
| UC20 | Xem kết quả thanh toán | Khách hàng |
| UC21 | Xem danh sách đơn hàng | Khách hàng |
| UC22 | Lọc đơn hàng theo trạng thái | Khách hàng |
| UC23 | Xem chi tiết đơn hàng | Khách hàng |
| UC24 | Đánh giá sản phẩm | Khách hàng |
| UC49 | Huỷ đơn hàng | Khách hàng |
| UC52 | Cập nhật thông tin nhận hàng | Khách hàng |

**Ghi chú:** UC12 gồm xem, thêm, sửa, xoá và đặt địa chỉ mặc định. UC19 đã bao gồm thanh toán lại đơn ở trạng thái `PENDING`/`FAILED` khi phiên chưa hết hạn; đơn COD không hiện lời nhắc thanh toán trực tuyến. UC24 chỉ khả dụng khi đơn hàng đã `COMPLETED`; Quản trị viên phải hoàn tất bước `DELIVERED → COMPLETED` trong UC43 trước khi khách đánh giá. UC49 cho phép huỷ đơn `PENDING`/`CONFIRMED` khi giao dịch trực tuyến chưa `SUCCEEDED`, có hộp thoại xác nhận và hoàn tồn kho. UC52 chỉ cho sửa khi đơn còn `PENDING`; thông tin nhận hàng được đồng bộ cho mọi đơn trong cùng phiên và phí giao hàng được tính lại.
