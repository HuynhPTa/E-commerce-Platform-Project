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
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long completedOrders = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);
        long revenueMinor = orderRepository.sumRevenueByStatus(OrderStatus.COMPLETED);
        long todayOrders = orderRepository.countByCreatedAtGreaterThanEqual(startOfToday);
        long todayRevenueMinor = orderRepository.sumRevenueByStatusSince(OrderStatus.COMPLETED, startOfToday);

        Map<String, Long> ordersByStatus = statusCounts(orderRepository.countGroupByStatus());
        List<OrderSummaryResponse> recentOrders = orderResponseMapper
                .toSummaries(orderRepository.findTop8ByOrderByCreatedAtDesc());

        return new AdminDashboardResponse(totalUsers, activeUsers, totalShops, pendingShops,
                totalProducts, totalOrders, pendingOrders, completedOrders, cancelledOrders,
                revenueMinor, todayOrders, todayRevenueMinor, ordersByStatus, recentOrders);
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
