package com.ecommerce.entity;

import java.util.Map;
import java.util.Set;

public enum OrderStatus {
    PENDING, CONFIRMED, SHIPPING, DELIVERED, COMPLETED, CANCELLED;

    // Luồng xử lý đơn của người bán: xác nhận -> giao hàng -> đã giao -> hoàn tất.
    // Chỉ được huỷ khi đơn chưa bàn giao cho vận chuyển.
    private static final Map<OrderStatus, Set<OrderStatus>> SELLER_TRANSITIONS = Map.of(
            PENDING, Set.of(CONFIRMED, CANCELLED),
            CONFIRMED, Set.of(SHIPPING, CANCELLED),
            SHIPPING, Set.of(DELIVERED),
            DELIVERED, Set.of(COMPLETED),
            COMPLETED, Set.of(),
            CANCELLED, Set.of()
    );

    public boolean canSellerMoveTo(OrderStatus next) {
        return SELLER_TRANSITIONS.getOrDefault(this, Set.of()).contains(next);
    }
}
