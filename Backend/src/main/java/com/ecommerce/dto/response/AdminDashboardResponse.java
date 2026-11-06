package com.ecommerce.dto.response;

import java.util.List;
import java.util.Map;

public record AdminDashboardResponse(long totalUsers, long activeUsers,
                                     long totalShops, long pendingShops,
                                     long totalProducts,
                                     long totalOrders, long pendingOrders,
                                     long confirmedOrders, long shippingOrders,
                                     long deliveredOrders, long completedOrders,
                                     long cancelledOrders, long processingOrders,
                                     long revenueMinor, long todayOrders, long todayRevenueMinor,
                                     long averageOrderValueMinor,
                                     double completionRate, double cancellationRate,
                                     Map<String, Long> ordersByStatus,
                                     List<OrderSummaryResponse> recentOrders) {}
