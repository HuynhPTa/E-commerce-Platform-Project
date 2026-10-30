package com.ecommerce.dto.response;

import java.util.List;
import java.util.Map;

public record SellerDashboardResponse(long productCount,
                                      long totalOrders, long pendingOrders,
                                      long completedOrders, long cancelledOrders,
                                      long revenueMinor, long todayOrders, long todayRevenueMinor,
                                      Map<String, Long> ordersByStatus,
                                      List<OrderSummaryResponse> recentOrders,
                                      // Đơn đã xác nhận, đang chờ đóng gói/giao (cũ nhất trước)
                                      long toPackOrders, List<OrderSummaryResponse> ordersToPack,
                                      // Biến thể còn ít hàng (stock <= lowStockThreshold)
                                      int lowStockThreshold, long lowStockCount,
                                      List<LowStockItemResponse> lowStockItems) {}
