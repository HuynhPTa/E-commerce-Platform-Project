package com.ecommerce.dto.response;

import java.util.Map;

// Số liệu tổng hợp cho trang quản lý đơn hàng.
public record AdminOrderStatsResponse(
        long totalOrders,
        long pendingOrders,
        long confirmedOrders,
        long shippingOrders,
        long deliveredOrders,
        long completedOrders,
        long cancelledOrders,
        long processingOrders,
        long revenueMinor,
        long todayOrders,
        long todayRevenueMinor,
        long averageOrderValueMinor,
        double completionRate,
        double cancellationRate,
        Map<String, Long> ordersByStatus) {}
