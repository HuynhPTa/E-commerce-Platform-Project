package com.ecommerce.dto.response;

// Số liệu tổng hợp cho trang quản lý sản phẩm.
public record AdminProductStatsResponse(
        long activeProducts,
        long deletedProducts,
        long totalVariants,
        long totalStock,
        long outOfStockVariants,
        long lowStockVariants,
        long soldCount,
        long categoriesInUse) {}
