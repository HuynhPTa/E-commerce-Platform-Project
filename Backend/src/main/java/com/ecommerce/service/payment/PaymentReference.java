package com.ecommerce.service.payment;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Mã tham chiếu gửi sang cổng thanh toán, ví dụ MH12T1760000000000.
 * Có timestamp để lần thanh toán lại không trùng orderId/txnRef với lần trước.
 */
public final class PaymentReference {
    private static final Pattern PATTERN = Pattern.compile("^MH(\\d+)T");

    private PaymentReference() {
    }

    public static String create(int checkoutSessionId) {
        return "MH" + checkoutSessionId + "T" + System.currentTimeMillis();
    }

    public static int parseSessionId(String reference) {
        if (reference == null || reference.isBlank()) {
            return 0;
        }
        Matcher matcher = PATTERN.matcher(reference);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ex) {
                return 0;
            }
        }
        // Tương thích với dữ liệu cũ chỉ lưu checkoutSessionId.
        try {
            return Integer.parseInt(reference);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
