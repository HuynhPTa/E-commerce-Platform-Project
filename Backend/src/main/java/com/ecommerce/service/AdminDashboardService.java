package com.ecommerce.service;

import com.ecommerce.dto.response.AdminDashboardResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.ShopStatus;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderResponseMapper orderResponseMapper;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        long totalUsers = userRepository.countByIsDelete(0);
        long activeUsers = userRepository.countByIsDeleteAndStatus(0, 1);
        long totalShops = shopRepository.count();
        long pendingShops = shopRepository.countByStatus(ShopStatus.PENDING);
        long totalProducts = productRepository.count();

        long totalOrders = orderRepository.count();
        Map<String, Long> ordersByStatus = statusCounts(orderRepository.countGroupByStatus());
        long pendingOrders = countStatus(ordersByStatus, OrderStatus.PENDING);
        long confirmedOrders = countStatus(ordersByStatus, OrderStatus.CONFIRMED);
        long shippingOrders = countStatus(ordersByStatus, OrderStatus.SHIPPING);
        long deliveredOrders = countStatus(ordersByStatus, OrderStatus.DELIVERED);
        long completedOrders = countStatus(ordersByStatus, OrderStatus.COMPLETED);
        long cancelledOrders = countStatus(ordersByStatus, OrderStatus.CANCELLED);
        long processingOrders = pendingOrders + confirmedOrders + shippingOrders;
        long revenueMinor = orderRepository.sumRevenueByStatus(OrderStatus.COMPLETED);
        long todayOrders = orderRepository.countByCreatedAtGreaterThanEqual(startOfToday);
        long todayRevenueMinor = orderRepository.sumRevenueByStatusSince(OrderStatus.COMPLETED, startOfToday);
        long averageOrderValueMinor = 0;
        if (completedOrders > 0) {
            averageOrderValueMinor = revenueMinor / completedOrders;
        }

        List<OrderSummaryResponse> recentOrders = orderResponseMapper
                .toSummaries(orderRepository.findTop8ByOrderByCreatedAtDesc());

        return new AdminDashboardResponse(totalUsers, activeUsers, totalShops, pendingShops,
                totalProducts, totalOrders, pendingOrders, confirmedOrders, shippingOrders,
                deliveredOrders, completedOrders, cancelledOrders, processingOrders,
                revenueMinor, todayOrders, todayRevenueMinor, averageOrderValueMinor,
                percentage(completedOrders, totalOrders), percentage(cancelledOrders, totalOrders),
                ordersByStatus, recentOrders);
    }

    private static long countStatus(Map<String, Long> counts, OrderStatus status) {
        Long value = counts.get(status.name());
        if (value == null) {
            return 0;
        }
        return value;
    }

    private static double percentage(long part, long total) {
        if (total == 0) {
            return 0;
        }
        return Math.round(part * 1000.0 / total) / 10.0;
    }

    static Map<String, Long> statusCounts(List<Object[]> rows) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            result.put(status.name(), 0L);
        }
        for (Object[] row : rows) {
            result.put(((OrderStatus) row[0]).name(), (Long) row[1]);
        }
        return result;
    }
}
