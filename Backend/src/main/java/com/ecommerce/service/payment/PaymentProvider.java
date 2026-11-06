package com.ecommerce.service.payment;

import com.ecommerce.entity.Payment;
import com.ecommerce.entity.PaymentMethod;

import java.util.Map;

public interface PaymentProvider {
    PaymentMethod method();

    /** True khi đã có đủ credential trong cấu hình (không kiểm tra kết nối mạng). */
    boolean isConfigured();

    /** Tạo URL chuyển người dùng sang cổng thanh toán. */
    String createPaymentUrl(Payment payment, String clientIp);

    /** Xác thực chữ ký và đọc kết quả từ return URL hoặc IPN. */
    PaymentCallback verifyCallback(Map<String, String> params);
}
