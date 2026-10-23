package com.ecommerce.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    ADDRESS_NOT_EXISTED(1036, "Địa chỉ không tồn tại", HttpStatus.NOT_FOUND),
    ROOM_EXISTED(1001, "Phòng đã tồn tại", HttpStatus.CONFLICT),
    EMAIL_EXISTED(1002, "Email đã tồn tại", HttpStatus.CONFLICT),
    EMAIL_NOT_EXISTED(1003, "Tài khoản không tồn tại", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1004, "Yêu cầu chưa được xác thực", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1005, "Không có quyền truy cập", HttpStatus.FORBIDDEN),
    USER_NOT_EXISTED(1006, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    HOTEL_EXISTED(1007, "Khách sạn đã tồn tại", HttpStatus.CONFLICT),
    HOTEL_NOT_EXISTED(1008, "Khách sạn không tồn tại", HttpStatus.NOT_FOUND),
    ROOM_NOT_EXISTED(1009, "Phòng không tồn tại", HttpStatus.NOT_FOUND),
    ROOM_ALREADY_BOOKED(1010, "Phòng đã được đặt", HttpStatus.CONFLICT),
    INVALID_DATE_RANGE(1011, "Ngày trả phòng không được nhỏ hơn ngày nhận", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION(1012, "Trạng thái chuyển đổi không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1013, "Mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_EXISTED(1014, "Vai trò không tồn tại", HttpStatus.NOT_FOUND),
    TOKEN_NOT_FOUND(1015, "Không tìm thấy refresh token trên cookie", HttpStatus.NOT_FOUND),
    TOKEN_NOT_VALID(1016, "Token đã hết hạn", HttpStatus.UNAUTHORIZED),
    BOOKING_NOT_EXISTED(1017, "Không tìm thấy lịch đặt", HttpStatus.NOT_FOUND),
    INVOICE_FAILED(1018, "Ngày checkIn phải trước ngày checkOut", HttpStatus.BAD_REQUEST),
    CANNOT_SEND_MESSAGE_TO_SELF(1019, "Không thể gửi tin nhắn cho bản thân", HttpStatus.BAD_REQUEST),
    SERVICE_NOT_EXISTED(1020, "Dịch vụ không tồn tại", HttpStatus.NOT_FOUND),
    INVOICE_NOT_EXISTED(1021, "Không tìm thấy hóa đơn", HttpStatus.NOT_FOUND),
    FEEDBACK_NOT_EXISTED(1022, "Không tìm thấy feedback", HttpStatus.NOT_FOUND),
    ROLE_NOT_DELETE(1023, "Không thể xóa quyền của hệ thống", HttpStatus.BAD_REQUEST),
    CLOUDINARY_DELETE_FAILED(1024, "Xóa ảnh trên Cloudinary thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    IMAGE_NOT_FOUND(1025, "Không tìm thấy ảnh khách sạn", HttpStatus.NOT_FOUND),
    REQUEST_HOTEL_EXISTED(1026, "Bạn đã có yêu cầu tạo khách sạn rồi", HttpStatus.CONFLICT),
    REQUEST_HOTEL_NOT_DELETED(1027, "Không thể xóa yêu cầu tạo khách sạn", HttpStatus.CONFLICT),
    SERVICE_EXISTED(1028, "Dịch vụ đã tồn tại", HttpStatus.CONFLICT),
    PERMISSION_NOT_EXISTED(1029, "Không tìm thấy PERMISSION", HttpStatus.NOT_FOUND),
    ROLE_IS_USED(1030, "Vai trò đang được sử dụng không thể xóa", HttpStatus.BAD_REQUEST),
    ACCOUNT_IS_BANED(1031, "Tài khoản đã bị ngưng hoạt động", HttpStatus.BAD_REQUEST),
    INVALID_INPUT(1032, "Thông tin đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK(1033, "Không đủ số lượng tồn kho", HttpStatus.CONFLICT),
    RESOURCE_NOT_FOUND(1034, "Không tìm thấy tài nguyên", HttpStatus.NOT_FOUND),

    // --- Checkout Module (Công việc của bạn) ---
    CHECKOUT_SESSION_NOT_FOUND(1060, "Không tìm thấy phiên thanh toán", HttpStatus.NOT_FOUND),
    CART_EMPTY(1061, "Giỏ hàng trống", HttpStatus.BAD_REQUEST),
    INVALID_CART_ITEM(1062, "Có sản phẩm không thuộc giỏ hàng của bạn", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_AVAILABLE(1063, "Sản phẩm hiện không còn bán", HttpStatus.BAD_REQUEST),

    // --- Checkout hardening (gói C, dải 1150-1199) ---
    SHOP_NOT_AVAILABLE(1150, "Shop hiện không hoạt động hoặc chưa được duyệt", HttpStatus.BAD_REQUEST),
    CHECKOUT_TOTAL_TOO_LARGE(1151, "Tổng giá trị đơn hàng vượt quá giới hạn cho phép", HttpStatus.BAD_REQUEST),

    // --- Admin & Seller orders/users (dải 1170-1189) ---
    ORDER_NOT_EXISTED(1170, "Đơn hàng không tồn tại", HttpStatus.NOT_FOUND),
    CANNOT_MODIFY_SELF(1171, "Bạn không thể thay đổi trạng thái tài khoản của chính mình", HttpStatus.BAD_REQUEST),
    CANNOT_LOCK_ADMIN(1172, "Không thể khoá tài khoản quản trị viên", HttpStatus.BAD_REQUEST),

    // --- Review Module (Công việc 8, dải 1160-1169) ---
    REVIEW_ORDER_ITEM_NOT_FOUND(1160, "Không tìm thấy món hàng cần đánh giá", HttpStatus.NOT_FOUND),
    REVIEW_NOT_ALLOWED(1161, "Bạn không có quyền đánh giá món hàng này", HttpStatus.FORBIDDEN),
    REVIEW_ORDER_NOT_COMPLETED(1162, "Chỉ có thể đánh giá khi đơn hàng đã hoàn tất", HttpStatus.BAD_REQUEST),
    REVIEW_ALREADY_EXISTS(1163, "Sản phẩm này đã được đánh giá trong đơn hàng", HttpStatus.CONFLICT),

    // --- Category Module (Công việc của Hoàng) ---
    CATEGORY_NOT_EXISTED(1040, "Danh mục không tồn tại", HttpStatus.NOT_FOUND),
    CATEGORY_SLUG_EXISTED(1041, "Slug danh mục đã tồn tại", HttpStatus.CONFLICT),
    CATEGORY_INVALID_PARENT(1042, "Danh mục cha không hợp lệ (không thể chọn chính nó hoặc danh mục con của nó)", HttpStatus.BAD_REQUEST),
    CATEGORY_HAS_CHILDREN(1043, "Danh mục còn danh mục con, hãy xoá hoặc chuyển danh mục con trước", HttpStatus.CONFLICT),
    CATEGORY_HAS_PRODUCTS(1044, "Danh mục đang có sản phẩm, không thể xoá", HttpStatus.CONFLICT),

    // --- Shop Module (Công việc của Hoàng) ---
    SHOP_NOT_EXISTED(1050, "Shop không tồn tại", HttpStatus.NOT_FOUND),
    SHOP_EXISTED(1051, "Bạn đã đăng ký shop rồi", HttpStatus.CONFLICT),
    SHOP_NAME_EXISTED(1052, "Tên shop đã được sử dụng", HttpStatus.CONFLICT),

    // --- Seller Product Module (Gói A - Công việc 3, dải 1100-1149) ---
    PRODUCT_NOT_EXISTED(1100, "Sản phẩm không tồn tại", HttpStatus.NOT_FOUND),
    PRODUCT_NOT_OWNED(1101, "Bạn không có quyền quản lý sản phẩm này", HttpStatus.FORBIDDEN),
    VARIANT_NOT_EXISTED(1102, "Biến thể sản phẩm không tồn tại", HttpStatus.NOT_FOUND),
    LAST_VARIANT_DELETE_NOT_ALLOWED(1103, "Không thể xoá biến thể cuối cùng của sản phẩm", HttpStatus.BAD_REQUEST),
    VARIANT_SKU_EXISTED(1104, "SKU biến thể đã tồn tại", HttpStatus.CONFLICT),
    VARIANT_IN_USE(1105, "Biến thể đã có trong đơn hàng, không thể xoá", HttpStatus.CONFLICT),
    PRODUCT_IMAGE_NOT_EXISTED(1106, "Ảnh sản phẩm không tồn tại", HttpStatus.NOT_FOUND),
    PRODUCT_IMAGE_LIMIT_EXCEEDED(1107, "Mỗi sản phẩm chỉ được tối đa 10 ảnh", HttpStatus.BAD_REQUEST),
    PRODUCT_IMAGE_INVALID_TYPE(1108, "Chỉ chấp nhận file ảnh JPEG, PNG, WEBP hoặc GIF", HttpStatus.BAD_REQUEST),
    PRODUCT_IMAGE_TOO_LARGE(1109, "Ảnh vượt quá dung lượng cho phép (5 MB)", HttpStatus.BAD_REQUEST),
    PRODUCT_IMAGE_UPLOAD_FAILED(1110, "Lưu ảnh thất bại, vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR),

    UNCATEGORED_EXCEPTION(9999, "Uncategorized exception", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}