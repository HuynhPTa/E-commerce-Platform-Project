package com.ecommerce.dto.response;

import java.util.List;
import java.util.Map;

public record AdminDashboardResponse(long totalUsers, long activeUsers,
                                     long totalShops, long pendingShops,
                                     long totalProducts,
                                     long totalOrders, long pendingOrders,
                                     long completedOrders, long cancelledOrders,
                                     long revenueMinor, long todayOrders, long todayRevenueMinor,
                                     Map<String, Long> ordersByStatus,
                                     List<OrderSummaryResponse> recentOrders) {}
