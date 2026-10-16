package com.ecommerce.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugUtil {
    private SlugUtil() {}

    // "Điện thoại & Phụ kiện" -> "dien-thoai-phu-kien"
    public static String toSlug(String input) {
        if (input == null) return "";
        String s = input.trim().toLowerCase(Locale.ROOT).replace('đ', 'd');
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        s = s.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        return s.length() > 140 ? s.substring(0, 140).replaceAll("-+$", "") : s;
    }
}
