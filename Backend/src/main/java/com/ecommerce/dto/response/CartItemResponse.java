package com.ecommerce.dto.response;

import java.util.Map;

public record CartItemResponse(Integer id, Integer variantId, Integer productId, String productName,
                               String thumbnailUrl, String shopId, String shopName,
                               Map<String, String> attributes, long unitPriceMinor,
                               int stockQuantity, int quantity) {}
