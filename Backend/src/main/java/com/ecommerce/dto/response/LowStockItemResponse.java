package com.ecommerce.dto.response;

import java.util.Map;

// Biến thể sắp hết hàng, hiển thị ở bảng điều khiển người bán
public record LowStockItemResponse(int productId, String productName, int variantId, String sku,
                                   Map<String, String> attributes, int stockQuantity,
                                   String thumbnailUrl) {}
