package com.ecommerce.dto.response;

// Số liệu tổng hợp cho trang quản lý danh mục.
public record AdminCategoryStatsResponse(
        long totalCategories,
        long rootCategories,
        long leafCategories,
        long categoriesWithProducts,
        long emptyCategories,
        long maxDepth) {}
