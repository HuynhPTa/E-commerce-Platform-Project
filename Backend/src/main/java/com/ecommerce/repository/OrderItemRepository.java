package com.ecommerce.repository;

import com.ecommerce.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    // order_items chỉ lưu variant_id dạng số (snapshot), dùng để chặn xoá variant đã bán
    boolean existsByVariantId(int variantId);
}
