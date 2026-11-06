# Use Case — Quản trị viên (Admin)

Quản trị viên quản trị website bán hàng. Ngoài các use case xem sản phẩm dùng chung **UC01–UC06**, Quản trị viên có các use case sau:

| Mã | Tên Use Case | Tác nhân |
|---|---|---|
| UC08 | Đăng nhập | Quản trị viên |
| UC09 | Đăng nhập bằng Google/Facebook | Quản trị viên |
| UC10 | Đăng xuất | Quản trị viên |
| UC25 | Xem dashboard website | Quản trị viên |
| UC26 | Xem danh sách người dùng | Quản trị viên |
| UC27 | Tìm kiếm và lọc người dùng | Quản trị viên |
| UC28 | Khoá/mở khoá tài khoản người dùng | Quản trị viên |
| UC53 | Xem thống kê người dùng | Quản trị viên |
| UC54 | Xem chi tiết tài khoản người dùng | Quản trị viên |
| UC55 | Tạo tài khoản người dùng | Quản trị viên |
| UC56 | Cập nhật tài khoản người dùng | Quản trị viên |
| UC57 | Xoá mềm tài khoản người dùng | Quản trị viên |
| UC29 | Xem cây danh mục | Quản trị viên |
| UC30 | Thêm danh mục | Quản trị viên |
| UC31 | Cập nhật danh mục | Quản trị viên |
| UC32 | Xoá danh mục | Quản trị viên |
| UC33 | Xem danh sách sản phẩm quản trị | Quản trị viên |
| UC34 | Tạo sản phẩm | Quản trị viên |
| UC35 | Xem chi tiết sản phẩm quản trị | Quản trị viên |
| UC36 | Cập nhật sản phẩm | Quản trị viên |
| UC37 | Xoá mềm sản phẩm | Quản trị viên |
| UC38 | Quản lý phiên bản và tồn kho | Quản trị viên |
| UC39 | Quản lý ảnh sản phẩm | Quản trị viên |
| UC40 | Xem danh sách đơn hàng quản trị | Quản trị viên |
| UC41 | Tìm kiếm và lọc đơn hàng quản trị | Quản trị viên |
| UC42 | Xem chi tiết đơn hàng quản trị | Quản trị viên |
| UC43 | Cập nhật trạng thái đơn hàng | Quản trị viên |

**Ghi chú:** UC26–UC28 và UC53–UC57 dùng API quản trị người dùng `/api/admin/users/**` và màn hình `/admin/users`. UC53 hiển thị tổng người dùng, đang hoạt động, đã khoá, quản trị viên và người mua (không tính tài khoản xoá mềm). UC54 hiển thị hồ sơ, shop (nếu có), tổng đơn, đơn hoàn tất, đơn đã huỷ và tổng chi tiêu từ đơn `COMPLETED`. UC55 kiểm tra email trùng, mật khẩu tối thiểu 6 ký tự. UC56 cho phép đổi thông tin, vai trò, trạng thái và mật khẩu (để trống là giữ nguyên), nhưng không tự sửa mình, không hạ quyền quản trị viên cuối cùng và không khoá tài khoản quản trị. UC57 là xoá mềm; chặn tự xoá và chặn xoá tài khoản quản trị. UC28 không cho phép khoá chính mình hoặc Admin khác. UC32 không cho xoá danh mục còn danh mục con hoặc còn sản phẩm. UC33–UC39 dùng API quản trị sản phẩm `/api/admin/products/**`; Admin quản lý sản phẩm của mọi shop cũ, còn sản phẩm mới được gán về shop chính thức (shop `APPROVED` id nhỏ nhất). UC38 gồm thêm, sửa, xoá phiên bản và cập nhật tồn kho. UC39 gồm tải lên và xoá ảnh sản phẩm. UC43 tuân theo luồng `PENDING → CONFIRMED → SHIPPING → DELIVERED → COMPLETED`; Quản trị viên chịu trách nhiệm bước cuối `DELIVERED → COMPLETED` để mở UC24. UC43 đã có endpoint `PATCH /api/admin/orders/{id}/status` và nút xử lý trong modal chi tiết đơn; dùng chung `OrderLifecycleService` với luồng khách hàng. UC44 (cấu hình website) chưa triển khai nên nằm trong `UC_DE_XUAT.md`.
