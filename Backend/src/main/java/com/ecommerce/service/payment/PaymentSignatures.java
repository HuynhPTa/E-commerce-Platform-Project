package com.ecommerce.service.payment;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.stream.Collectors;

public final class PaymentSignatures {
    private PaymentSignatures() {
    }

    public static String hmacSha256(String secret, String data) {
        return hmac("HmacSHA256", secret, data);
    }

    public static String hmacSha512(String secret, String data) {
        return hmac("HmacSHA512", secret, data);
    }

    private static String hmac(String algorithm, String secret, String data) {
        try {
            Mac mac = Mac.getInstance(algorithm);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), algorithm));
            return toHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể tạo chữ ký thanh toán", ex);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            result.append(Character.forDigit((value >> 4) & 0xF, 16));
            result.append(Character.forDigit(value & 0xF, 16));
        }
        return result.toString();
    }

    public static boolean constantTimeEquals(String expected, String actual) {
        if (expected == null || actual == null) {
            return false;
        }
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }

    public static String encode(String value) {
        // Giống mẫu chính thức của VNPay: application/x-www-form-urlencoded (khoảng trắng -> '+').
        // Không đổi '+' thành '%20' vì chữ ký phải khớp chuỗi VNPay nhận được.
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    /** Query string đã sắp xếp key và bỏ value rỗng — dùng chung cho tạo và xác thực chữ ký. */
    public static String query(Map<String, String> params) {
        return params.entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isEmpty())
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }
}
