package com.ecommerce.service.payment;

/**
 * Kết quả đã xác thực chữ ký của callback/IPN từ cổng thanh toán.
 * checkoutSessionId = 0 nghĩa là không đọc được mã phiên từ tham số.
 */
public record PaymentCallback(
        boolean validSignature,
        boolean success,
        int checkoutSessionId,
        String providerTransactionId,
        int amountMinor,
        String responseCode,
        String message
) {
}
