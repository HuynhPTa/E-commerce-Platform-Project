package com.ecommerce.service;

import com.ecommerce.dto.request.OrderStatusRequest;
import com.ecommerce.dto.response.AdminOrderStatsResponse;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminOrderService {
    private static final int MAX_PAGE_SIZE = 50;

    private final OrderRepository orderRepository;
    private final OrderResponseMapper orderResponseMapper;
    private final OrderLifecycleService orderLifecycleService;

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> list(OrderStatus status, String q, int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        String keyword = q == null || q.isBlank() ? null : q.trim();
        String term = keyword == null ? null : "%" + keyword.toLowerCase(Locale.ROOT) + "%";
        Integer idTerm = parseId(keyword);

        Page<Order> result = orderRepository.adminSearch(status, term, idTerm,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PageResponse<>(orderResponseMapper.toSummaries(result.getContent()),
                safePage, safeSize, result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public AdminOrderStatsResponse stats() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        Map<String, Long> ordersByStatus = AdminDashboardService.statusCounts(
                orderRepository.countGroupByStatus());

        long totalOrders = orderRepository.count();
        long pendingOrders = countStatus(ordersByStatus, OrderStatus.PENDING);
        long confirmedOrders = countStatus(ordersByStatus, OrderStatus.CONFIRMED);
        long shippingOrders = countStatus(ordersByStatus, OrderStatus.SHIPPING);
        long deliveredOrders = countStatus(ordersByStatus, OrderStatus.DELIVERED);
        long completedOrders = countStatus(ordersByStatus, OrderStatus.COMPLETED);
        long cancelledOrders = countStatus(ordersByStatus, OrderStatus.CANCELLED);
        long processingOrders = pendingOrders + confirmedOrders + shippingOrders;

        long revenueMinor = orderRepository.sumRevenueByStatus(OrderStatus.COMPLETED);
        long todayOrders = orderRepository.countByCreatedAtGreaterThanEqual(startOfToday);
        long todayRevenueMinor = orderRepository.sumRevenueByStatusSince(
                OrderStatus.COMPLETED, startOfToday);
        long averageOrderValueMinor = 0;
        if (completedOrders > 0) {
            averageOrderValueMinor = revenueMinor / completedOrders;
        }

        return new AdminOrderStatsResponse(totalOrders, pendingOrders, confirmedOrders,
                shippingOrders, deliveredOrders, completedOrders, cancelledOrders,
                processingOrders, revenueMinor, todayOrders, todayRevenueMinor,
                averageOrderValueMinor, percentage(completedOrders, totalOrders),
                percentage(cancelledOrders, totalOrders), ordersByStatus);
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse detail(int id) {
        Order order = orderRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        return orderResponseMapper.toDetail(order);
    }

    // Admin dùng chung luồng trạng thái với người bán nhưng không giới hạn theo shop.
    @Transactional
    public OrderDetailResponse updateStatus(int id, OrderStatusRequest request) {
        Order order = orderRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        Order updated = orderLifecycleService.updateStatus(order, request.getStatus());
        return orderResponseMapper.toDetail(updated);
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

    static Integer parseId(String keyword) {
        if (keyword == null) {
            return null;
        }
        try {
            return Integer.valueOf(keyword);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
