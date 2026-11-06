# MarketHub — Use Case đề xuất bổ sung

- **Ngày lập:** 2026-11-06
- **Trạng thái:** Đề xuất cho các use case **chưa triển khai**; `UC51` đã triển khai và chuyển sang danh sách hiện hành
- **Phạm vi:** Bổ sung cho danh sách 52 use case hiện tại trong `UC_TONG_HOP.md` (`UC01`–`UC43`, `UC46`, `UC49`, `UC51`, `UC52`–`UC57`; mã `UC45` đã bỏ)
- **Mô hình:** Website bán hàng độc lập một thương hiệu (single-brand store)

Các use case trong mục 1 và 2 chưa nằm trong danh sách chức năng hiện tại vì backend/frontend chưa có endpoint, bảng dữ liệu hoặc màn hình tương ứng. Tài liệu này ghi rõ hiện trạng, luồng đề xuất và điều kiện cần có trước khi đưa vào triển khai. Mục 3 ghi nhận các chức năng đã hoàn thành để đối chiếu, không còn là đề xuất.

## 1. Tổng hợp đề xuất

| Mã | Tên Use Case | Tác nhân | Ưu tiên | Trạng thái |
|---|---|---|---|---|
| UC44 | Cấu hình website | Quản trị viên | Trung bình | Chưa triển khai |
| UC47 | Quên mật khẩu / đặt lại mật khẩu | Khách | Cao | Chưa triển khai |
| UC48 | Đổi mật khẩu | Khách hàng, Quản trị viên | Cao | Chưa triển khai |
| UC50 | Quản lý đánh giá | Quản trị viên | Cao | Chưa triển khai |

**Lý do ưu tiên:** UC47 và UC48 hoàn thiện vòng đời tài khoản sau đăng ký/đăng nhập; UC50 bảo vệ nội dung đánh giá công khai trên storefront. UC44 giúp Admin đổi thông tin nhận diện/hỗ trợ mà không phải sửa code, nhưng chưa chặn luồng mua hàng nên ưu tiên trung bình. UC49 và UC51 đã được triển khai, không còn nằm trong danh sách đề xuất.

## 2. Chi tiết từng use case

### UC44 — Cấu hình website

**Tác nhân:** Quản trị viên  
**Mục tiêu:** Quản trị viên cập nhật thông tin nhận diện và liên hệ của website (tên hiển thị, logo, hotline, email hỗ trợ, địa chỉ, liên kết mạng xã hội) để storefront dùng ngay, không cần sửa code hay triển khai lại.

**Hiện trạng:**

- Chưa có entity, bảng, repository, service hoặc controller cho cấu hình website.
- `DataSeeder` và các component storefront đang dùng chuỗi/tên thương hiệu cố định; chưa đọc cấu hình từ backend.
- Chưa có route `/admin/settings` và mục điều hướng tương ứng trong trang quản trị.
- Chưa có cơ chế upload logo qua API cấu hình; hệ thống mới có upload ảnh sản phẩm.

**Luồng đề xuất:**

1. Quản trị viên mở mục “Cấu hình website” trong trang quản trị.
2. Hệ thống hiển thị giá trị hiện tại; nếu chưa có bản ghi cấu hình thì dùng giá trị mặc định.
3. Quản trị viên sửa các trường được phép, tải logo mới (tuỳ chọn) và bấm lưu.
4. Backend validate dữ liệu, lưu cấu hình và trả về bản ghi mới.
5. Storefront làm mới dữ liệu cấu hình để hiển thị tên, logo, hotline, email, địa chỉ và liên kết mạng xã hội mới ở header/footer.

**Điều kiện triển khai:**

- **Cơ sở dữ liệu:** thêm bảng `site_settings` theo hướng một bản ghi duy nhất (singleton), gồm tối thiểu `id`, `site_name`, `logo_url`, `hotline`, `support_email`, `address`, `facebook_url`, `instagram_url`, `youtube_url`, `updated_at`, `updated_by`. Dùng migration Flyway mới; không tạo FK tới `users` nếu bảng do Hibernate quản lý, tương tự cách migration `V13` xử lý `reviews`.
- **Backend:**
  - Entity/repository/service đọc bản ghi đầu tiên; nếu chưa có thì trả giá trị mặc định và chỉ ghi bản ghi khi Admin lưu lần đầu.
  - `GET /api/admin/site-settings` và `PUT /api/admin/site-settings` chỉ cho `ADMIN`; `GET /api/site-settings` công khai cho storefront.
  - Validate độ dài chuỗi, định dạng email, URL mạng xã hội và số điện thoại; chuẩn hoá chuỗi rỗng thành `null`.
  - Logo dùng lại cơ chế upload/static hiện có, giới hạn loại file và dung lượng; xoá file cũ khi thay logo nếu không còn được tham chiếu.
  - Không trả các trường nội bộ như `updated_by` ra API công khai.
- **Frontend:** thêm route `/admin/settings`, mục điều hướng “Cấu hình website”, form có xem trước logo; hiển thị lỗi từng trường và thông báo lưu thành công. Storefront đọc cấu hình qua query dùng chung, có giá trị dự phòng khi API lỗi để không vỡ layout.
- **Bảo mật:** `@PreAuthorize("hasAuthority('ADMIN')")`; escape nội dung khi render; không cho nhập HTML/script tuỳ ý; kiểm tra quyền trước khi upload/xoá logo.
- **Kiểm thử:** Admin đọc/cập nhật thành công; user thường và khách gọi API admin bị từ chối; validate email/URL/độ dài; storefront hiển thị giá trị mới sau khi lưu; API công khai không lộ `updated_by`; upload logo sai loại/quá dung lượng bị chặn.

**Điều kiện hoàn thành:** Quản trị viên đổi được thông tin nhận diện và liên hệ; storefront hiển thị đúng giá trị mới; dữ liệu được validate; không có đường dẫn nào cho phép người không phải Admin sửa cấu hình.

**Rủi ro / lưu ý:** Không đưa các trường ảnh hưởng đến thanh toán, vận chuyển hoặc bảo mật vào UC này. Nếu sau này cần nhiều bộ cấu hình theo môi trường, nên chuyển sang bảng key-value có phạm vi rõ ràng thay vì thêm cột rời rạc.

---

### UC47 — Quên mật khẩu / đặt lại mật khẩu

**Tác nhân:** Khách  
**Mục tiêu:** Người dùng quên mật khẩu có thể tự đặt lại qua email mà không cần quản trị viên can thiệp.

**Hiện trạng:**

- Backend chỉ có `POST /api/auth/register` và `POST /api/auth/login`; chưa có endpoint quên/đặt lại mật khẩu.
- Mật khẩu đã được mã hoá bằng BCrypt qua `PasswordEncoder`, nhưng chưa có cơ chế token đặt lại.
- Chưa có bảng lưu token đặt lại mật khẩu.
- `pom.xml` chưa có `spring-boot-starter-mail`; cấu hình SMTP và template email chưa có.
- Storefront chưa có route `/forgot-password` hoặc `/reset-password`.

**Luồng đề xuất:**

1. Khách chọn “Quên mật khẩu” ở trang đăng nhập và nhập email.
2. Hệ thống luôn trả về cùng một thông báo chung, không tiết lộ email có tồn tại hay không.
3. Nếu email hợp lệ và tài khoản đang hoạt động, hệ thống tạo token ngẫu nhiên, lưu **hash** của token vào DB, gửi email chứa liên kết đặt lại.
4. Khách mở liên kết, nhập mật khẩu mới và xác nhận.
5. Hệ thống kiểm tra token còn hạn, chưa dùng, đúng người dùng; cập nhật mật khẩu mới bằng BCrypt; đánh dấu token đã dùng và vô hiệu hoá các token cũ của cùng người dùng.
6. Khách được chuyển về trang đăng nhập và đăng nhập bằng mật khẩu mới.

**Điều kiện triển khai:**

- **Cơ sở dữ liệu:** thêm bảng `password_reset_tokens` gồm `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`, `requested_ip` (tuỳ chọn); unique index trên `token_hash`, index trên `user_id`; dùng migration Flyway mới (tiếp theo chuỗi `V9`–`V14` hiện có). Trên database mới, Flyway chạy trước Hibernate nên **không tạo FK tới `users`** (bảng do Hibernate quản lý); quan hệ `user_id` được bảo đảm ở tầng service, giống cách migration `V13` đang làm với `reviews`.
- **Backend:**
  - Thêm dependency và cấu hình gửi email (host, port, username, password, from) qua biến môi trường/`application-secrets.properties`, không hardcode credential.
  - Tạo service tạo/xác thực token, repository và hai endpoint công khai:
    - `POST /api/auth/forgot-password` — nhận `email`.
    - `POST /api/auth/reset-password` — nhận `token`, `newPassword`, `confirmPassword`.
  - Token dùng `SecureRandom`, đủ dài, chỉ lưu hash; hết hạn sau 15–30 phút; mỗi token chỉ dùng một lần; token mới phải vô hiệu hoá token cũ.
  - Áp dụng chính sách mật khẩu tối thiểu giống đăng ký; trả lỗi thống nhất cho token sai/hết hạn/đã dùng.
  - Thêm rate limit theo email/IP để tránh spam email và dò tài khoản.
  - Thêm hai đường dẫn vào `PUBLIC_ENDPOINTS` của `SecurityConfig`.
- **Frontend:** thêm route `/forgot-password` và `/reset-password`; form nhập email, form mật khẩu mới; đọc token từ query string; hiển thị trạng thái thành công/thất bại; thêm liên kết từ trang đăng nhập. Giao diện bám theo `design/prototype/login.html`.
- **Bảo mật:** không ghi token thô vào log; email phải được escape khi render; không trả khác biệt giữa email tồn tại và không tồn tại; cân nhắc vô hiệu hoá token khi tài khoản bị khoá.
- **Kiểm thử:** email tồn tại/không tồn tại, token hết hạn, token dùng lại, token của người khác, mật khẩu mới không hợp lệ, đăng nhập bằng mật khẩu cũ thất bại, đăng nhập bằng mật khẩu mới thành công, không lưu token thô.

**Điều kiện hoàn thành:** Khách tự đặt lại được mật khẩu qua email thật; token một lần, có hạn; mật khẩu cũ không còn hiệu lực; không lộ việc email có tồn tại.

**Rủi ro / lưu ý:** Nếu chưa cấu hình SMTP thì **không nên** giả lập chức năng này bằng cách trả token ra response. Có thể dùng mail catcher (MailHog/Mailpit) trong môi trường dev, nhưng production bắt buộc có dịch vụ email.

---

### UC48 — Đổi mật khẩu

**Tác nhân:** Khách hàng, Quản trị viên  
**Mục tiêu:** Người dùng đã đăng nhập chủ động đổi mật khẩu khi cần.

**Hiện trạng:**

- `GET /api/me` và `PUT /api/me` chỉ đọc/cập nhật hồ sơ; không có endpoint đổi mật khẩu.
- `AuthenticationService` đã có BCrypt để kiểm tra mật khẩu khi đăng nhập nhưng chưa có nghiệp vụ đổi mật khẩu.
- Access token JWT có thời hạn 1 giờ; chưa có cơ chế thu hồi token cũ sau khi đổi mật khẩu.
- Chưa có refresh token thực tế (hằng số thời hạn có trong service nhưng chưa có endpoint/refresh token table).

**Luồng đề xuất:**

1. Người dùng mở trang tài khoản, chọn “Đổi mật khẩu”.
2. Nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.
3. Backend xác thực JWT, kiểm tra mật khẩu hiện tại bằng BCrypt, kiểm tra mật khẩu mới khác mật khẩu cũ và đúng chính sách.
4. Cập nhật mật khẩu mới đã mã hoá; ghi nhận thời điểm đổi.
5. Người dùng được đăng xuất khỏi phiên hiện tại (hoặc tất cả phiên) và đăng nhập lại bằng mật khẩu mới.

**Điều kiện triển khai:**

- **Backend:** thêm `POST /api/me/password` (hoặc `PUT /api/me/password`) yêu cầu xác thực; body gồm `currentPassword`, `newPassword`, `confirmPassword`; lấy người dùng từ `Jwt.getSubject()`, không nhận email từ client.
- Kiểm tra `passwordEncoder.matches(currentPassword, user.getPassword())`; từ chối nếu mật khẩu mới trùng mật khẩu cũ; mã hoá bằng BCrypt trước khi lưu.
- Thêm cột `password_changed_at` hoặc `token_version` vào `users` để vô hiệu hoá JWT cũ; cập nhật `CustomJwtDecoder` kiểm tra claim tương ứng. Nếu chưa làm bước này, phải ghi rõ access token cũ vẫn dùng được tối đa 1 giờ.
- Tài khoản OAuth2 có thể chưa có mật khẩu; không cho đổi mật khẩu nếu `password` rỗng. Cần luồng đặt mật khẩu riêng hoặc hướng dẫn dùng quên mật khẩu.
- Thêm rate limit và thông báo lỗi không tiết lộ chi tiết tài khoản.
- **Frontend:** form trong trang tài khoản; kiểm tra xác nhận mật khẩu; hiển thị lỗi từng trường; sau khi thành công xoá token, chuyển về đăng nhập.
- **Kiểm thử:** sai mật khẩu hiện tại, mật khẩu mới quá ngắn, xác nhận không khớp, trùng mật khẩu cũ, đổi thành công, token cũ bị từ chối (nếu có `token_version`), tài khoản OAuth2 không có mật khẩu.

**Điều kiện hoàn thành:** Người dùng đổi được mật khẩu khi đã đăng nhập; mật khẩu cũ không còn đăng nhập được; không làm lộ hoặc ghi log mật khẩu.

---

### UC50 — Quản lý đánh giá

**Tác nhân:** Quản trị viên  
**Mục tiêu:** Quản trị viên ẩn/xoá đánh giá vi phạm và tính lại điểm đánh giá sản phẩm.

**Hiện trạng:**

- `ReviewController` chỉ có tạo đánh giá, danh sách công khai theo sản phẩm và kiểm tra điều kiện đánh giá.
- Chưa có endpoint danh sách/ẩn/xoá đánh giá cho quản trị viên.
- Entity `Review` chưa có trạng thái kiểm duyệt, lý do hoặc người kiểm duyệt; bảng `reviews` trong migration `V13` cũng chưa có các cột này.
- `ReviewService.listByProduct` đang trả tất cả đánh giá; `recalculateRating` chỉ chạy khi tạo đánh giá mới.
- Chưa có màn hình quản lý đánh giá trong frontend quản trị.

**Luồng đề xuất:**

1. Quản trị viên mở mục “Đánh giá”, lọc theo sản phẩm, số sao, trạng thái hoặc từ khoá.
2. Quản trị viên xem nội dung và chọn ẩn (hoặc hiện lại) một đánh giá, kèm lý do.
3. Hệ thống cập nhật trạng thái kiểm duyệt, tính lại `rating_avg`/`rating_count` của sản phẩm.
4. Đánh giá bị ẩn không còn xuất hiện ở storefront; khách đã đánh giá vẫn không thể đánh giá lại cùng món.

**Điều kiện triển khai:**

- **Cơ sở dữ liệu:** thêm migration Flyway mới cho bảng `reviews`:
  - `status` (`VISIBLE`/`HIDDEN`) hoặc `is_hidden`;
  - `moderated_by`, `moderated_at`, `moderation_reason` (tuỳ chọn nhưng nên có để audit);
  - index phục vụ lọc `(product_id, status, created_at)`.
- **Entity/repository:** cập nhật `Review`; thêm truy vấn danh sách admin có filter và truy vấn đếm/trung bình chỉ tính đánh giá `VISIBLE`.
- **Backend:**
  - `GET /api/admin/reviews` — phân trang, lọc `productId`, `rating`, `status`, `q`.
  - `PATCH /api/admin/reviews/{id}/status` — body `status`, `reason`; chỉ ADMIN.
  - Có thể bổ sung `DELETE /api/admin/reviews/{id}` dưới dạng xoá mềm; không khuyến khích xoá cứng vì mất dấu vết và ảnh hưởng unique constraint.
  - `ReviewService.listByProduct` chỉ trả `VISIBLE`; `recalculateRating` tính lại sau mỗi lần ẩn/hiện/xoá mềm.
  - Không thay đổi điều kiện tạo đánh giá: mỗi `order_item`/sản phẩm trong đơn vẫn chỉ đánh giá một lần, kể cả khi đánh giá đã bị ẩn.
- **Frontend:** thêm route `/admin/reviews` và mục điều hướng; bảng đánh giá, bộ lọc, nút ẩn/hiện, lý do; không hiển thị thông tin kiểm duyệt ở storefront.
- **Bảo mật:** `@PreAuthorize("hasAuthority('ADMIN')")`; kiểm tra review tồn tại; ghi audit người thao tác/thời điểm; validate độ dài lý do.
- **Kiểm thử:** ẩn đánh giá làm biến mất khỏi API công khai, điểm trung bình/đếm giảm đúng, hiện lại phục hồi đúng, đánh giá ẩn vẫn chặn đánh giá lại, user thường không gọi được API admin, lọc/phân trang đúng.

**Điều kiện hoàn thành:** Quản trị viên ẩn/hiện được đánh giá vi phạm; storefront chỉ hiển thị đánh giá hợp lệ; điểm đánh giá sản phẩm luôn khớp dữ liệu hiển thị.

---

## 3. Chức năng đã có — không đưa vào đề xuất

Các mục dưới đây đã được triển khai trong code, chỉ cần ghi nhận trong danh sách hiện tại; không tính là chức năng còn thiếu.

### 3.1 Thanh toán lại đơn chưa thanh toán

- `PaymentService.createPaymentUrl` cho phép tạo lại URL thanh toán khi giao dịch trước đó thất bại; đơn/phiên chưa hết hạn vẫn thanh toán lại được.
- Trang kết quả thanh toán của storefront hiển thị nút thanh toán lại khi phiên ở trạng thái `PENDING`/`FAILED` và chưa `EXPIRED`.
- Điều kiện vận hành: credential VNPay/MoMo phải được cấu hình; nếu thiếu, backend trả lỗi 503/1180.
- Không cần thêm use case mới; UC19 đã bao gồm nghiệp vụ này.

### 3.2 Gửi và xử lý callback/IPN thanh toán

- Các endpoint đã có:
  - `GET /api/payments/vnpay/return`
  - `GET /api/payments/vnpay/ipn`
  - `GET /api/payments/momo/return`
  - `GET /api/payments/momo/ipn`
- Backend kiểm tra chữ ký, số tiền, xử lý idempotent và cập nhật trạng thái thanh toán/đơn hàng.
- Các endpoint đã nằm trong `PUBLIC_ENDPOINTS` của `SecurityConfig`.
- Đã ghi nhận trong UC46 với tác nhân `VNPay/MoMo, Hệ thống`; không cần thêm use case mới. Mã `UC45` không dùng vì xử lý giao dịch là việc nội bộ của cổng thanh toán.
- Nếu đơn đã `CANCELLED` hoặc phiên đã `EXPIRED`, callback/IPN **không được** chuyển đơn lại `CONFIRMED`; chỉ ghi nhận để hoàn tiền/đối soát.
- Callback thành công đến sau khi mọi đơn trong phiên đã huỷ không mở lại đơn; payment chuyển `REFUND_REQUIRED` (“Cần hoàn tiền”) và giữ số tiền cổng đã báo để đối soát thủ công. Callback trùng trả kết quả idempotent, không cộng tiền hai lần.
- Điều kiện khi chạy thật: URL callback/IPN phải truy cập được từ Internet (hoặc dùng sandbox/tunnel), credential và chữ ký phải khớp cấu hình từng cổng.

### 3.3 Huỷ đơn và cập nhật thông tin nhận hàng

- `POST /api/orders/{id}/cancel` cho phép khách huỷ đơn `PENDING`/`CONFIRMED` khi giao dịch trực tuyến chưa `SUCCEEDED`; COD huỷ được trước khi giao.
- Hệ thống hoàn tồn kho, tính lại phí/tổng của phiên theo các đơn còn hiệu lực; khi mọi đơn bị huỷ, phiên và giao dịch chuyển `FAILED`, số tiền về 0.
- `PATCH /api/orders/{id}/shipping` cho phép sửa người nhận, số điện thoại, địa chỉ và tỉnh/thành khi đơn còn `PENDING`; thông tin được đồng bộ cho mọi đơn trong phiên và phí giao hàng được tính lại.
- Storefront hiển thị hộp thoại xác nhận trước khi huỷ và biểu mẫu sửa thông tin nhận hàng trong trang chi tiết đơn.

### 3.4 Tự đóng phiên thanh toán hết hạn và hoàn tồn kho

- `CheckoutExpiryScheduler` quét định kỳ (mặc định mỗi 60 giây) các phiên trực tuyến `PENDING`/`FAILED` chưa thanh toán quá **120 phút** (`checkout.expiry-minutes`).
- Mỗi phiên được xử lý trong transaction riêng, khoá theo thứ tự **checkout session → order → payment**; lỗi ở một phiên không chặn các phiên khác.
- Đơn `PENDING` bị huỷ và hoàn tồn kho đúng một lần; đơn đã giao/đang giao hoặc giao dịch đã `SUCCEEDED`/`REFUND_REQUIRED` bị bỏ qua.
- Khi không còn đơn hiệu lực, tổng phiên và payment về 0; phiên chuyển `EXPIRED`, payment chuyển `FAILED`.
- Job bị tắt trong profile test (`checkout.expiry.enabled=false`) để test không phụ thuộc thời gian; chạy lại nhiều lần vẫn idempotent.
- Đã ghi nhận thành `UC51` trong `UC_TONG_HOP.md`; không còn là đề xuất.

## 4. Thứ tự triển khai đề xuất

1. **UC47** — cần hạ tầng email và bảng token; làm sớm vì ảnh hưởng trực tiếp đến khả năng tự phục hồi tài khoản.
2. **UC48** — ít phụ thuộc, có thể làm song song UC47; nên làm cùng cơ chế thu hồi token.
3. **UC50** — cần migration và màn hình quản trị; có thể làm sau khi luồng mua hàng ổn định.
4. **UC44** — độc lập, có thể làm sau cùng khi chốt danh sách trường cấu hình và nơi hiển thị trên storefront.

## 5. Việc cần quyết định trước khi code

- Có dùng SMTP thật hay mail catcher cho từng môi trường?
- Thời hạn token đặt lại mật khẩu (đề xuất 15–30 phút) và chính sách mật khẩu.
- Có thu hồi JWT cũ sau khi đổi/đặt lại mật khẩu bằng `token_version` hay chấp nhận token cũ hết hạn sau tối đa 1 giờ?
- Đánh giá vi phạm sẽ **ẩn** (khuyến nghị) hay **xoá cứng**? Có cần lưu lý do kiểm duyệt không?
- Cấu hình website (UC44) gồm những trường nào, lưu một bản ghi hay key-value, và trường nào bắt buộc hiển thị trên header/footer?
- Đã chốt phương án `DELIVERED → COMPLETED`: Quản trị viên thực hiện trong UC43; UC24 chỉ mở sau bước này. Nếu muốn khách tự xác nhận “Đã nhận hàng”, cần thêm một use case mới ở giai đoạn sau.
