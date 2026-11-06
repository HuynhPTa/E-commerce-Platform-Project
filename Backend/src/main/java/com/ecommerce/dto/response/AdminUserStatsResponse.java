package com.ecommerce.dto.response;

// Số liệu tổng hợp cho trang quản lý người dùng.
public record AdminUserStatsResponse(
        long totalUsers,
        long activeUsers,
        long lockedUsers,
        long adminUsers,
        long buyerUsers) {}
