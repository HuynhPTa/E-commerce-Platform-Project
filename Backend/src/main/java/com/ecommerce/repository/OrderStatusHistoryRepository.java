package com.ecommerce.repository;

import com.ecommerce.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Integer> {
    List<OrderStatusHistory> findByOrder_IdOrderByChangedAtAscIdAsc(int orderId);
}
