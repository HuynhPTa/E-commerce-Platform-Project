package com.ecommerce.util;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Chính sách vận chuyển của cửa hàng.
 *
 * Đơn từ 499.000đ được miễn phí toàn quốc. Dưới ngưỡng này:
 * - Miền Nam: 0đ
 * - Miền Trung: 10.000đ
 * - Miền Bắc: 20.000đ
 */
public final class ShippingPolicy {

    public static final int FREE_SHIPPING_THRESHOLD_MINOR = 499_000;

    public enum Region {
        NORTH, CENTRAL, SOUTH
    }

    // Danh sách 34 tỉnh/thành theo đơn vị hành chính hiện hành.
    private static final Map<String, Region> PROVINCES = new LinkedHashMap<>();

    static {
        add(Region.NORTH, "Hà Nội");
        add(Region.NORTH, "Hải Phòng");
        add(Region.NORTH, "Bắc Ninh");
        add(Region.NORTH, "Cao Bằng");
        add(Region.NORTH, "Điện Biên");
        add(Region.NORTH, "Hưng Yên");
        add(Region.NORTH, "Lai Châu");
        add(Region.NORTH, "Lạng Sơn");
        add(Region.NORTH, "Lào Cai");
        add(Region.NORTH, "Ninh Bình");
        add(Region.NORTH, "Phú Thọ");
        add(Region.NORTH, "Quảng Ninh");
        add(Region.NORTH, "Sơn La");
        add(Region.NORTH, "Thái Nguyên");
        add(Region.NORTH, "Tuyên Quang");

        add(Region.CENTRAL, "Thanh Hóa");
        add(Region.CENTRAL, "Nghệ An");
        add(Region.CENTRAL, "Hà Tĩnh");
        add(Region.CENTRAL, "Quảng Trị");
        add(Region.CENTRAL, "Huế");
        add(Region.CENTRAL, "Đà Nẵng");
        add(Region.CENTRAL, "Quảng Ngãi");
        add(Region.CENTRAL, "Gia Lai");
        add(Region.CENTRAL, "Khánh Hòa");
        add(Region.CENTRAL, "Đắk Lắk");
        add(Region.CENTRAL, "Lâm Đồng");

        add(Region.SOUTH, "Hồ Chí Minh");
        add(Region.SOUTH, "Cần Thơ");
        add(Region.SOUTH, "An Giang");
        add(Region.SOUTH, "Cà Mau");
        add(Region.SOUTH, "Đồng Nai");
        add(Region.SOUTH, "Đồng Tháp");
        add(Region.SOUTH, "Tây Ninh");
        add(Region.SOUTH, "Vĩnh Long");
    }

    private ShippingPolicy() {
    }

    private static void add(Region region, String province) {
        PROVINCES.put(key(province), region);
    }

    private static String key(String province) {
        if (province == null) {
            return "";
        }
        return province.trim().toLowerCase(Locale.ROOT);
    }

    public static boolean isSupported(String province) {
        return PROVINCES.containsKey(key(province));
    }

    public static Region regionOf(String province) {
        return PROVINCES.get(key(province));
    }

    public static String normalize(String province) {
        if (province == null) {
            return null;
        }
        return province.trim();
    }

    /**
     * Tính phí vận chuyển theo tỉnh/thành và tạm tính của các món đã chọn.
     * Trả về 0 nếu tỉnh/thành không hợp lệ; nơi gọi phải kiểm tra trước.
     */
    public static int feeFor(String province, int subtotalMinor) {
        if (subtotalMinor >= FREE_SHIPPING_THRESHOLD_MINOR) {
            return 0;
        }
        Region region = regionOf(province);
        if (region == null) {
            return 0;
        }
        return switch (region) {
            case SOUTH -> 0;
            case CENTRAL -> 10_000;
            case NORTH -> 20_000;
        };
    }
}
