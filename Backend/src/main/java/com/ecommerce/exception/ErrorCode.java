package com.ecommerce.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

// FIX: bỏ import trùng, sửa các mã code bị trùng nhau, sửa typo và HTTP status sai
@Getter
public enum ErrorCode {
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