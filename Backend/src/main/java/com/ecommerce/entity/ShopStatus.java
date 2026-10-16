package com.ecommerce.entity;

import java.util.Map;
import java.util.Set;

public enum ShopStatus {
    PENDING,    // vừa đăng ký, chờ Admin duyệt
    APPROVED,   // đang hoạt động
    REJECTED,   // bị từ chối, người bán có thể sửa và gửi lại
    SUSPENDED;  // bị khoá tạm thời

    // Các bước chuyển trạng thái Admin được phép thực hiện
    private static final Map<ShopStatus, Set<ShopStatus>> ALLOWED = Map.of(
            PENDING, Set.of(APPROVED, REJECTED),
            APPROVED, Set.of(SUSPENDED),
            SUSPENDED, Set.of(APPROVED),
            REJECTED, Set.of(APPROVED)
    );

    public boolean canMoveTo(ShopStatus next) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(next);
    }
}
