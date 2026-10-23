package com.ecommerce.dto.response;

import java.util.Map;

public record OrderItemResponse(int id, int variantId, Integer productId, String productName,
                                Map<String, Object> attributes, int unitPriceMinor, int quantity,
                                int subtotalMinor, String thumbnailUrl) {}
