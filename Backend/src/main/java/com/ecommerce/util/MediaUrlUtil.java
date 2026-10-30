package com.ecommerce.util;

import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

public final class MediaUrlUtil {

    private MediaUrlUtil() {
    }

    /**
     * DB lưu đường dẫn tương đối (/uploads/...) để không gắn chết host.
     * API trả URL tuyệt đối để frontend dùng trực tiếp trong thẻ img.
     */
    public static String toAbsolute(String path) {
        if (path == null || path.isBlank()) {
            return null;
        }
        String trimmed = path.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        String normalized = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath().path(normalized).toUriString();
        } catch (IllegalStateException ex) {
            // Ngoài phạm vi request (test, job nền): trả đường dẫn tương đối
            return normalized;
        }
    }
}
