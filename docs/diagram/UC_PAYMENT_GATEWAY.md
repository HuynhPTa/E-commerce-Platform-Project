# Use Case — Cổng thanh toán (VNPay/MoMo)

Cổng thanh toán là hệ thống bên ngoài tham gia vào luồng thanh toán của Khách hàng; Hệ thống là thành phần nội bộ xử lý kết quả trả về.

| Mã | Tên Use Case | Tác nhân |
|---|---|---|
| UC19 | Thanh toán qua VNPay/MoMo | Khách hàng, VNPay/MoMo |
| UC46 | Gửi và xử lý callback/IPN thanh toán | VNPay/MoMo, Hệ thống |

**Ghi chú:** Mã `UC45` không sử dụng vì “xử lý giao dịch thanh toán” là việc nội bộ của VNPay/MoMo, không phải chức năng MarketHub làm. MarketHub tạo URL thanh toán (UC19), chuyển người dùng sang cổng thanh toán; cổng thanh toán xử lý giao dịch rồi gửi kết quả qua return/IPN (UC46). Backend kiểm tra chữ ký, số tiền, xử lý idempotent và cập nhật trạng thái thanh toán/đơn hàng. Nếu đơn đã `CANCELLED` hoặc phiên đã `EXPIRED`, callback/IPN không được chuyển đơn lại `CONFIRMED`; chỉ ghi nhận để hoàn tiền/đối soát. Khi tiền về sau khi mọi đơn trong phiên đã huỷ, payment chuyển `REFUND_REQUIRED` (“Cần hoàn tiền”), giữ số tiền cổng đã báo và phiên ở `FAILED` với tổng 0; callback trùng trả kết quả idempotent, không cộng tiền hai lần.
