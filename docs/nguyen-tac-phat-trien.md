# MarketHub — Bộ nguyên tắc phát triển

- **Ngày chốt:** 2026-11-06
- **Trạng thái:** Có hiệu lực cho toàn bộ phần việc tiếp theo
- **Phạm vi:** Backend Spring Boot, storefront React, ứng dụng quản trị React, cơ sở dữ liệu MySQL và tài liệu trong repository
- **Thứ tự ưu tiên khi mâu thuẫn:** yêu cầu mới nhất của người dùng → tài liệu này → đặc tả chức năng/API → tài liệu use case → code hiện có

Tài liệu này là nguồn nguyên tắc duy nhất. Khi một tài liệu khác còn nói “sàn nhiều shop”, “Store Manager” hoặc “người bán”, tài liệu khác đó là tài liệu cũ và phải sửa theo tài liệu này.

## 1. Vị trí tài liệu

| Nội dung | Đường dẫn |
|---|---|
| Bộ nguyên tắc phát triển | `docs/nguyen-tac-phat-trien.md` |
| Đặc tả chức năng và danh sách API | `docs/web-ban-hang-chuc-nang-va-api.md` |
| Danh sách use case tổng hợp | `docs/diagram/UC_TONG_HOP.md` |
| Use case theo tác nhân | `docs/diagram/UC_*.md` |
| Đề xuất ngoài phạm vi | `docs/diagram/UC_DE_XUAT.md` |

## 2. Mô hình sản phẩm

1. MarketHub là **website bán hàng độc lập một thương hiệu** (single-brand store), hình mẫu là một trang như Adidas: một thương hiệu, một danh mục sản phẩm, khách vào mua hàng.
2. Không phải sàn thương mại điện tử nhiều shop. Không có đăng ký mở shop, duyệt shop, khoá shop, trang shop công khai hoặc CTA “Kênh người bán” trên giao diện.
3. Chỉ có **một shop chính thức** về mặt vận hành. Trong giai đoạn 1, shop `APPROVED` có id nhỏ nhất được dùng làm shop chính thức; sản phẩm do Admin tạo được gán về shop này.
4. Module seller, bảng `shops`, cột `shop_id` và các API seller **được giữ để tương thích dữ liệu**, nhưng bị ẩn khỏi điều hướng và không được quảng bá. Không xoá dữ liệu lịch sử.
5. Không refactor schema trong giai đoạn 1 nếu không thật sự cần. Mọi thay đổi dữ liệu phải có phương án backup và không làm hỏng đơn hàng cũ.
6. Tên thương hiệu tạm giữ “MarketHub”; chỉ đổi khi người dùng chốt tên mới.

## 3. Tác nhân và phân quyền

| Tác nhân | Trách nhiệm |
|---|---|
| **Khách (Guest)** | Xem trang chủ, sản phẩm, đánh giá; đăng ký, đăng nhập |
| **Khách hàng (Customer)** | Hồ sơ, địa chỉ, giỏ hàng, đặt hàng, thanh toán, đơn của mình, đánh giá |
| **Quản trị viên (Admin)** | Quản lý người dùng, danh mục, sản phẩm, biến thể, tồn kho, ảnh, đơn hàng toàn hệ thống |
| **Cổng thanh toán** | VNPay/MoMo tiếp nhận giao dịch và gửi callback/IPN |
| **Hệ thống** | Xử lý callback/IPN, cập nhật thanh toán/đơn hàng, tác vụ nền |

Quy tắc bắt buộc:

1. Không còn tác nhân **Store Manager/Seller** trong mô hình nghiệp vụ. Admin chịu trách nhiệm vận hành catalog và đơn hàng.
2. API quản trị dùng `@PreAuthorize("hasAuthority('ADMIN')")` ở cấp lớp; không chỉ ẩn nút trên giao diện.
3. API của khách hàng phải kiểm tra quyền sở hữu. Truy cập tài nguyên của người khác trả `404`, không trả dữ liệu.
4. Quyền seller cũ (nếu còn dùng cho tương thích) vẫn xác định bằng chủ shop `APPROVED`; không cấp quyền seller cho Admin.
5. Không tin giá, tổng tiền, trạng thái hoặc số lượng tồn kho do client gửi lên; backend phải kiểm tra lại.

## 4. Phạm vi và trạng thái use case

1. Danh sách use case hiện hành chỉ chứa chức năng **đã có trong code**.
2. Chức năng chưa có endpoint, bảng dữ liệu hoặc màn hình phải nằm trong `UC_DE_XUAT.md`, không được ghi “Đã có”.
3. Trạng thái hợp lệ:
   - **Đã có** — có code backend + giao diện/API và đã kiểm chứng tối thiểu.
   - **Đã có (cần credential)** — code có, nhưng chưa thể chạy thật vì thiếu cấu hình.
   - **Cần cấu hình/kiểm thử** — có code một phần, chưa đủ điều kiện kết luận.
   - **Chưa triển khai** — chỉ nằm trong đề xuất.
4. Mã `UC45` không sử dụng.
5. `UC43` là quyền của Admin: `PATCH /api/admin/orders/{id}/status`, dùng chung luật chuyển trạng thái và hoàn kho; huỷ đơn phải hoàn tồn kho.
6. `UC24` chỉ mở sau khi đơn ở `COMPLETED`; Admin chịu trách nhiệm bước `DELIVERED → COMPLETED`.
7. `UC44` (cấu hình website) chưa có entity/controller/route/UI, phải nằm trong đề xuất cho đến khi được triển khai thật.
8. Không tuyên bố VNPay/MoMo hoặc Google/Facebook chạy end-to-end khi chưa có credential và chưa kiểm thử thật.
9. `UC49` đã triển khai tại `POST /api/orders/{id}/cancel`: khách chỉ huỷ đơn `PENDING`/`CONFIRMED` khi giao dịch trực tuyến chưa `SUCCEEDED`; hệ thống hoàn tồn kho và tính lại phí/tổng của phiên theo các đơn còn hiệu lực.
10. Khách được sửa thông tin nhận hàng khi đơn còn `PENDING` qua `PATCH /api/orders/{id}/shipping`; đổi tỉnh/thành sẽ tính lại phí giao hàng của phiên.
11. Phí giao hàng: miễn phí toàn quốc từ 499.000₫; dưới ngưỡng, miền Nam 0₫, miền Trung 10.000₫, miền Bắc 20.000₫. Thanh toán hỗ trợ COD và cổng trực tuyến.
12. Mọi chuyển trạng thái đơn, huỷ đơn, hoàn tồn kho, sửa thông tin nhận hàng và ghi nhận COD tập trung tại `OrderLifecycleService`; controller và service khác không tự viết lại luật.
13. Khi xử lý đơn/thanh toán phải khoá theo thứ tự **checkout session → order → payment** để tránh deadlock và tranh chấp với callback.
14. `POST /api/checkout` hỗ trợ `idempotencyKey` duy nhất theo từng người mua; khoá được trim, rỗng chuyển thành `null`, tối đa 64 ký tự. Gửi lại cùng khoá trả về phiên đã tạo, không tạo trùng đơn.
15. Phiên trực tuyến `PENDING`/`FAILED` chưa thanh toán tự hết hạn sau 120 phút: huỷ đơn `PENDING`, hoàn tồn kho, đưa tổng phiên/payment về 0 khi không còn đơn hiệu lực. Scheduler bị tắt trong profile test.
16. COD chỉ được coi là đã thu tiền khi mọi đơn còn hiệu lực trong phiên đã `DELIVERED` hoặc `COMPLETED`.
17. Callback thành công đến sau khi mọi đơn đã huỷ không được mở lại đơn; payment chuyển `REFUND_REQUIRED`, giữ số tiền cổng báo để đối soát thủ công. Callback trùng phải trả kết quả idempotent.
18. Mỗi request xác thực phải kiểm tra người dùng trong DB; tài khoản bị khoá/xoá mềm mất quyền ngay. Token không hợp lệ trả 401 (`BadJwtException`), không trả 500.
19. Doanh thu dashboard tính theo `completedAt`, không theo `createdAt`.
20. Storefront xoá toàn bộ cache truy vấn khi đăng nhập/đăng xuất hoặc nhận 401; khoá chống trùng checkout được giữ theo từng lần mount; biểu mẫu địa chỉ và tỉnh/thành reset khi đổi tài khoản.

## 5. Dữ liệu và an toàn dữ liệu

1. Dữ liệu hiển thị lấy từ backend/MySQL thật; không hardcode mảng sản phẩm, đơn hàng, đánh giá trong giao diện.
2. Không xoá cứng shop, sản phẩm, đơn hàng, đánh giá hoặc người dùng đang được tham chiếu. Sản phẩm dùng xoá mềm `DELETED`.
3. Không sửa hoặc xoá dữ liệu demo của người dùng `206` và các dòng giỏ hàng liên quan.
4. Không chạy lệnh SQL phá huỷ, migration hoặc seed đè dữ liệu khi chưa backup và chưa được người dùng đồng ý.
5. Không commit secret, credential, token hoặc file cấu hình chứa mật khẩu. Dùng biến môi trường và placeholder.
6. Thao tác xoá hàng loạt, publish, đổi hạ tầng hoặc git history phải hỏi trước.

## 6. Quy tắc giao diện storefront

1. Toàn bộ chữ hiển thị cho người dùng bằng **tiếng Việt**.
2. Bám sát prototype đã duyệt trong `design/prototype`: giữ bố cục, màu sắc, tên class CSS, tham số URL và prop `rating` của thẻ sản phẩm. Không tự thiết kế lại.
3. Giữ cấu trúc trang: thông báo đầu trang, header, điều hướng danh mục, lưới sản phẩm, bộ lọc, phân trang, footer.
4. Mọi trạng thái phải có giao diện rõ ràng: đang tải, rỗng, lỗi, không có kết quả, hết hàng.
5. Giá hiển thị theo định dạng Việt Nam (₫), ngày theo định dạng Việt Nam.
6. Không đưa CTA marketplace, tên shop khác, “Mở shop”, “Kênh người bán” vào storefront.
7. Ảnh phải có fallback khi lỗi; không để khung ảnh trống.

## 7. Quy tắc code storefront

Áp dụng cho mã mới hoặc mã sửa trong `Frontend/src`. Mục tiêu là code dài nhưng đọc được, không tối ưu ký tự.

1. **Tên và chú thích bằng tiếng Việt, viết đầy đủ, không viết tắt**: `danhSachSanPham`, `capNhatTuKhoaTimKiem`, `dangTaiDanhSach`. Tên file, route, hàm API và trường JSON vẫn dùng tiếng Anh.
2. **Không dùng ternary** `? :`. Dùng `if/else` hoặc gán giá trị mặc định trước.
3. **Không dùng `||`, `&&`, `??`** trong biểu thức nghiệp vụ. Tách thành câu lệnh `if` riêng.
4. **Không dùng optional chaining** `?.`. Kiểm tra `null`/`undefined` bằng câu lệnh rõ ràng.
5. **Không dùng arrow function**. Dùng `function tenHam(...) {}` hoặc hàm được khai báo riêng.
6. **Không dùng default parameter** `function f(x = 1)`. Kiểm tra và gán bên trong thân hàm.
7. **Không dùng destructuring hoặc spread** `const { a } = obj`, `...props`. Truy cập trực tiếp `thuocTinh.a`.
8. **Không dùng method chaining** `.map().filter()`. Tách từng bước, dùng vòng lặp `while`/`for` và mảng trung gian.
9. **Mỗi dòng một hành động**. Không viết nhiều phép gán hoặc nhiều lời gọi hàm trên cùng dòng.
10. **Luôn khai báo `const` hoặc `let` rõ ràng**, không dựa vào biến toàn cục; kết thúc câu lệnh bằng dấu `;`.
11. Không dùng `Array.prototype.map` với arrow; nếu cần render danh sách, xây mảng phần tử bằng vòng lặp và biến trung gian.
12. Chú thích ngắn bằng tiếng Việt ở nơi logic không tự giải thích được; không chú thích lại điều hiển nhiên.
13. Hook của React vẫn gọi theo đúng thứ tự; không đặt hook trong điều kiện.
14. Không thêm thư viện mới nếu thư viện hiện có làm được.

## 8. Quy tắc code ứng dụng quản trị và backend

1. Ứng dụng quản trị (`Frontend/src`) giữ convention hiện có: tiếng Việt cho nhãn UI, tiếng Anh cho tên file/hàm/API.
2. Backend giữ cấu trúc `controller → service → repository`, DTO request/response, `ApiResponse` thống nhất.
3. Không lặp logic nghiệp vụ ở nhiều controller. Luồng Admin và Seller dùng chung service, khác nhau ở phạm vi kiểm tra quyền.
4. Service ghi dữ liệu phải có `@Transactional`; service chỉ đọc dùng `@Transactional(readOnly = true)`.
5. Lỗi nghiệp vụ dùng `AppException` + `ErrorCode`; không trả chuỗi lỗi tuỳ tiện.
6. Giữ phân trang, tìm kiếm và sắp xếp ổn định; không tạo truy vấn N+1 mới.
7. Không đổi schema hoặc xoá cột khi chưa có migration và chưa được duyệt.
8. Mọi thay đổi hành vi phải có test tương ứng; test backend dùng profile `test` (H2), không chạm MySQL thật.
9. Luồng trạng thái đơn, hoàn kho, COD và đồng bộ phí/tổng phiên chỉ nằm trong `OrderLifecycleService`; giữ thứ tự khoá checkout session → order → payment.
10. Checkout có mã chống trùng theo người mua; callback thanh toán và scheduler hết hạn phải idempotent, không hoàn kho hai lần và không mở lại đơn đã huỷ.

## 9. Quy ước API

1. Base URL dev: `http://localhost:8080`; prefix `/api`.
2. Response thành công:
   ```json
   { "code": 1000, "message": "Thành công", "result": {} }
   ```
3. Response lỗi dùng `code`, `message`, `result: null`; HTTP status lấy từ `ErrorCode`.
4. Xác thực bằng `Authorization: Bearer <access_token>`.
5. Phân trang trả `items`, `page`, `size`, `totalItems`, `totalPages`.
6. API Admin nằm dưới `/api/admin/**`; API khách hàng dưới `/api/**`; API seller cũ dưới `/api/seller/**` chỉ để tương thích.
7. Không đổi tên trường JSON đã dùng trong storefront nếu không cập nhật đồng thời cả hai phía.

## 10. Kiểm chứng và trung thực

1. Chạy kiểm tra hẹp nhất và liên quan nhất sau mỗi thay đổi: `mvn test`, `npm run lint`, `npm run build`.
2. Kiểm thử trình duyệt cho luồng chính; ghi rõ đã thao tác gì, dữ liệu nào bị thay đổi.
3. Không nói “đã chạy được” nếu chưa có log/kết quả. Nếu bị chặn bởi credential hoặc môi trường, nói rõ lý do.
4. Khi sửa lỗi, ưu tiên tái hiện bằng test hoặc bước kiểm thử cụ thể trước khi sửa.
5. Dọn dữ liệu test sau khi kiểm thử; không để sản phẩm/đơn hàng rác trong MySQL.

## 11. Quản lý thay đổi

1. Giữ diff nhỏ, đúng phạm vi; không format hoặc refactor code không liên quan.
2. Tôn trọng thay đổi chưa commit của người dùng; không revert hoặc ghi đè phần mình không tạo.
3. Mặc định không commit; chỉ commit khi người dùng yêu cầu rõ.
4. Trước khi sửa file lớn hoặc xoá module, đọc code xung quanh và kiểm tra `AGENTS.md` của dự án.
5. Khi yêu cầu mơ hồ, hỏi một câu tập trung thay vì tự đoán.

## 12. Ngoài phạm vi giai đoạn 1

- Không xoá bảng `shops`, không bỏ `shop_id`, không xoá module seller backend.
- Không làm multi-warehouse, coupon, tích điểm, chat, thông báo realtime.
- Không làm trả hàng/hoàn tiền tự động; khách chỉ tự huỷ đơn chưa bàn giao và chưa thanh toán trực tuyến thành công.
- Không làm phân quyền nhiều cấp, nhân viên shop hoặc nhiều shop chính thức.
- Không kiểm thử thanh toán/OAuth thật khi chưa có credential.
- Không làm cấu hình website (UC44) trong giai đoạn 1; giữ trong đề xuất.
