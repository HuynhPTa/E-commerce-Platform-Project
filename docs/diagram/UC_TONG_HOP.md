# MarketHub — Danh sách Use Case

- **Ngày lập:** 2026-11-06
- **Mô hình:** Website bán hàng độc lập một thương hiệu (single-brand store), không phải sàn nhiều shop.
- **Phạm vi:** Các chức năng nghiệp vụ của website bán hàng: khách xem sản phẩm, khách hàng mua hàng và quản trị viên vận hành website.
- **Nguồn đối chiếu:** `docs/web-ban-hang-chuc-nang-va-api.md`, route frontend và controller backend hiện có.
- **Tổng số hiện tại:** 52 use case đang dùng (`UC01`–`UC43`, `UC46`, `UC49`, `UC51`, `UC52`–`UC57`); mã `UC45` đã bỏ. Ngoài ra có 4 đề xuất `UC44`, `UC47`, `UC48`, `UC50`.

## 1. Tác nhân

| Tác nhân | Mô tả |
|---|---|
| **Khách (Guest)** | Người chưa đăng nhập; xem trang chủ, danh sách sản phẩm, chi tiết sản phẩm, đánh giá; đăng ký và đăng nhập. |
| **Khách hàng (Customer)** | Người đã đăng nhập; quản lý hồ sơ, địa chỉ, giỏ hàng, đặt hàng, thanh toán, xem đơn và đánh giá sản phẩm. |
| **Quản trị viên (Admin)** | Người quản trị website bán hàng; quản lý người dùng, danh mục, sản phẩm, biến thể, tồn kho, ảnh sản phẩm và đơn hàng. |
| **Cổng thanh toán (VNPay/MoMo)** | Hệ thống bên ngoài tiếp nhận giao dịch và gửi kết quả thanh toán về MarketHub. |
| **Hệ thống** | Thành phần nội bộ xử lý callback/IPN, cập nhật trạng thái thanh toán/đơn hàng và tự đóng phiên thanh toán hết hạn. |

**Ghi chú về tác nhân:** Trên sơ đồ use case có thể dùng quan hệ tổng quát hoá để **Khách hàng** và **Quản trị viên** kế thừa **Khách** cho các use case dùng chung `UC01`–`UC06`. Trong bảng dưới đây, cột tác nhân ghi đủ ba tác nhân để tránh hiểu nhầm là chỉ Khách mới dùng được.

## 2. Danh sách Use Case

### 2.1. Khách (Guest)

| Mã | Tên Use Case | Tác nhân | Trạng thái |
|---|---|---|---|
| UC01 | Xem trang chủ | Khách, Khách hàng, Quản trị viên | Đã có |
| UC02 | Xem danh sách sản phẩm | Khách, Khách hàng, Quản trị viên | Đã có |
| UC03 | Tìm kiếm, lọc và sắp xếp sản phẩm | Khách, Khách hàng, Quản trị viên | Đã có |
| UC04 | Xem chi tiết sản phẩm | Khách, Khách hàng, Quản trị viên | Đã có |
| UC05 | Chọn phiên bản sản phẩm | Khách, Khách hàng, Quản trị viên | Đã có |
| UC06 | Xem đánh giá sản phẩm | Khách, Khách hàng, Quản trị viên | Đã có |
| UC07 | Đăng ký tài khoản | Khách | Đã có |
| UC08 | Đăng nhập | Khách, Khách hàng, Quản trị viên | Đã có |
| UC09 | Đăng nhập bằng Google/Facebook | Khách, Khách hàng, Quản trị viên | Cần cấu hình/kiểm thử |

### 2.2. Khách hàng (Customer)

| Mã | Tên Use Case | Tác nhân | Trạng thái |
|---|---|---|---|
| UC10 | Đăng xuất | Khách hàng, Quản trị viên | Đã có |
| UC11 | Xem và cập nhật hồ sơ cá nhân | Khách hàng | Đã có |
| UC12 | Quản lý địa chỉ nhận hàng | Khách hàng | Đã có |
| UC13 | Xem giỏ hàng | Khách hàng | Đã có |
| UC14 | Thêm sản phẩm vào giỏ hàng | Khách hàng | Đã có |
| UC15 | Cập nhật số lượng sản phẩm trong giỏ hàng | Khách hàng | Đã có |
| UC16 | Xoá sản phẩm khỏi giỏ hàng | Khách hàng | Đã có |
| UC17 | Mua ngay | Khách hàng | Đã có |
| UC18 | Đặt hàng | Khách hàng | Đã có |
| UC19 | Thanh toán qua VNPay/MoMo | Khách hàng, VNPay/MoMo | Đã có (cần credential) |
| UC20 | Xem kết quả thanh toán | Khách hàng | Đã có |
| UC21 | Xem danh sách đơn hàng | Khách hàng | Đã có |
| UC22 | Lọc đơn hàng theo trạng thái | Khách hàng | Đã có |
| UC23 | Xem chi tiết đơn hàng | Khách hàng | Đã có |
| UC24 | Đánh giá sản phẩm | Khách hàng | Đã có |
| UC49 | Huỷ đơn hàng | Khách hàng | Đã có |
| UC52 | Cập nhật thông tin nhận hàng | Khách hàng | Đã có |

### 2.3. Quản trị viên (Admin)

| Mã | Tên Use Case | Tác nhân | Trạng thái |
|---|---|---|---|
| UC25 | Xem dashboard website | Quản trị viên | Đã có |
| UC26 | Xem danh sách người dùng | Quản trị viên | Đã có |
| UC27 | Tìm kiếm và lọc người dùng | Quản trị viên | Đã có |
| UC28 | Khoá/mở khoá tài khoản người dùng | Quản trị viên | Đã có |
| UC53 | Xem thống kê người dùng | Quản trị viên | Đã có |
| UC54 | Xem chi tiết tài khoản người dùng | Quản trị viên | Đã có |
| UC55 | Tạo tài khoản người dùng | Quản trị viên | Đã có |
| UC56 | Cập nhật tài khoản người dùng | Quản trị viên | Đã có |
| UC57 | Xoá mềm tài khoản người dùng | Quản trị viên | Đã có |
| UC29 | Xem cây danh mục | Quản trị viên | Đã có |
| UC30 | Thêm danh mục | Quản trị viên | Đã có |
| UC31 | Cập nhật danh mục | Quản trị viên | Đã có |
| UC32 | Xoá danh mục | Quản trị viên | Đã có |
| UC33 | Xem danh sách sản phẩm quản trị | Quản trị viên | Đã có |
| UC34 | Tạo sản phẩm | Quản trị viên | Đã có |
| UC35 | Xem chi tiết sản phẩm quản trị | Quản trị viên | Đã có |
| UC36 | Cập nhật sản phẩm | Quản trị viên | Đã có |
| UC37 | Xoá mềm sản phẩm | Quản trị viên | Đã có |
| UC38 | Quản lý phiên bản và tồn kho | Quản trị viên | Đã có |
| UC39 | Quản lý ảnh sản phẩm | Quản trị viên | Đã có |
| UC40 | Xem danh sách đơn hàng quản trị | Quản trị viên | Đã có |
| UC41 | Tìm kiếm và lọc đơn hàng quản trị | Quản trị viên | Đã có |
| UC42 | Xem chi tiết đơn hàng quản trị | Quản trị viên | Đã có |
| UC43 | Cập nhật trạng thái đơn hàng | Quản trị viên | Đã có |

### 2.4. Cổng thanh toán (VNPay/MoMo)

| Mã | Tên Use Case | Tác nhân | Trạng thái |
|---|---|---|---|
| UC46 | Gửi và xử lý callback/IPN thanh toán | VNPay/MoMo, Hệ thống | Đã có |

**Ghi chú:** Mã `UC45` **không sử dụng**. “Xử lý giao dịch thanh toán” là việc nội bộ của VNPay/MoMo, không phải chức năng MarketHub làm. MarketHub chỉ tạo URL thanh toán (UC19) và tiếp nhận/xử lý callback/IPN (UC46). Vì vậy VNPay/MoMo là tác nhân phụ của UC19 và UC46, không cần một use case riêng.

### 2.5. Hệ thống

| Mã | Tên Use Case | Tác nhân | Trạng thái |
|---|---|---|---|
| UC51 | Tự đóng phiên thanh toán hết hạn và hoàn tồn kho | Hệ thống | Đã có |

## 3. Ghi chú phạm vi

- Không còn tác nhân **Quản lý cửa hàng/Seller** và không còn các use case đăng ký mở shop, duyệt shop, khoá shop, xem trang shop. Website vận hành như một website bán hàng độc lập; Quản trị viên đăng sản phẩm và xử lý đơn hàng.
- Các use case quản trị sản phẩm, phiên bản, tồn kho, ảnh và cập nhật trạng thái đơn hàng dùng API quản trị chuyên biệt: sản phẩm qua `/api/admin/products/**`, đơn hàng qua `/api/admin/orders/**`. Admin không cần sở hữu shop; sản phẩm mới được gán về shop chính thức (shop `APPROVED` có id nhỏ nhất, hiện là shop `1`). Sản phẩm cũ thuộc shop khác vẫn xem/sửa được, không gán lại hàng loạt.
- **UC19** chỉ tạo được URL thanh toán khi cấu hình credential VNPay/MoMo; nếu chưa cấu hình, backend trả lỗi 503/1180.
- **UC09** đã có code OAuth2 Google/Facebook nhưng credential vẫn là dummy; chưa kiểm thử đăng nhập thật.
- **UC24** chỉ thực hiện được khi đơn hàng ở trạng thái `COMPLETED`; mỗi món trong đơn được đánh giá một lần và mỗi sản phẩm chỉ một đánh giá trong cùng đơn. Đơn chỉ đạt `COMPLETED` sau khi **UC43** chuyển từ `DELIVERED` sang `COMPLETED`.
- **UC43** tuân theo luồng `PENDING → CONFIRMED → SHIPPING → DELIVERED → COMPLETED`; Quản trị viên chịu trách nhiệm bước cuối `DELIVERED → COMPLETED`. Chỉ được huỷ ở `PENDING` hoặc `CONFIRMED`, huỷ sẽ hoàn tồn kho. Admin cập nhật qua `PATCH /api/admin/orders/{id}/status`, dùng chung `OrderLifecycleService` với luồng khách hàng; UI quản trị có nút xử lý ngay trong modal chi tiết đơn.
- **UC46** phải xử lý idempotent. Nếu đơn đã `CANCELLED` hoặc phiên đã `EXPIRED`, callback/IPN **không được** chuyển đơn lại `CONFIRMED`; chỉ ghi nhận để hoàn tiền/đối soát. Nếu tiền đến sau khi mọi đơn đã huỷ, payment chuyển `REFUND_REQUIRED` và giữ số tiền cổng đã báo.
- **UC49** cho phép khách huỷ đơn `PENDING` hoặc `CONFIRMED` khi giao dịch trực tuyến chưa `SUCCEEDED`; COD luôn huỷ được trước khi giao. Hệ thống hoàn tồn kho, tính lại phí/tổng của phiên theo các đơn còn hiệu lực và hiển thị hộp thoại xác nhận trước khi huỷ.
- **UC52** cho phép khách sửa người nhận, số điện thoại, địa chỉ và tỉnh/thành khi đơn còn `PENDING`; thông tin được đồng bộ cho mọi đơn trong cùng phiên và phí giao hàng được tính lại.
- **UC53–UC57** dùng API quản trị người dùng `/api/admin/users/**`. Thống kê gồm tổng, đang hoạt động, đã khoá, quản trị viên và người mua; chi tiết hiển thị hồ sơ, shop (nếu có), số đơn, đơn hoàn tất, đơn đã huỷ và tổng chi tiêu từ đơn `COMPLETED`. Tạo tài khoản kiểm tra email trùng và mật khẩu tối thiểu 6 ký tự; cập nhật cho phép đổi vai trò/trạng thái/mật khẩu nhưng không tự sửa mình, không hạ quyền quản trị viên cuối cùng và không khoá tài khoản quản trị. Xoá là xoá mềm, chặn tự xoá và chặn xoá tài khoản quản trị.
- **UC51** tự động đóng phiên trực tuyến `PENDING`/`FAILED` chưa thanh toán sau 120 phút: huỷ đơn `PENDING`, hoàn tồn kho, đưa tổng phiên/payment về 0 khi không còn đơn hiệu lực. Scheduler dùng khoá session-first và bị tắt trong profile test.
- Storefront mới hiện đã có danh sách sản phẩm, tìm kiếm/lọc/sắp xếp, chi tiết sản phẩm, chọn phiên bản, xem đánh giá, thêm nhanh vào giỏ, mua ngay, đăng nhập, đăng ký, giỏ hàng có chọn từng món, đặt hàng với tỉnh/thành và COD, thanh toán trực tuyến, kết quả thanh toán (gồm nhãn “Cần hoàn tiền”), danh sách/lọc đơn hàng, chi tiết đơn hàng có huỷ đơn và sửa thông tin nhận hàng, tài khoản (hồ sơ cá nhân + địa chỉ giao hàng). Checkout giữ mã chống trùng khi thử lại.

## 4. Đề xuất bổ sung (chưa có trong code)

Các use case dưới đây **chưa được triển khai**, chỉ nên đưa vào backlog hoặc giai đoạn tiếp theo. Chi tiết điều kiện triển khai xem tại `UC_DE_XUAT.md`.

| Mã | Tên Use Case | Tác nhân |
|---|---|---|
| UC44 | Cấu hình website | Quản trị viên |
| UC47 | Quên mật khẩu / đặt lại mật khẩu | Khách |
| UC48 | Đổi mật khẩu | Khách hàng, Quản trị viên |
| UC50 | Quản lý đánh giá | Quản trị viên |
