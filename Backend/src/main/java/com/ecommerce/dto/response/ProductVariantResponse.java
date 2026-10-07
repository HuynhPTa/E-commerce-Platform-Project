package com.ecommerce.dto.response;

import java.util.Map;

public record ProductVariantResponse(Integer id, String sku, Map<String, String> attributes,
                                     long priceMinor, int stockQuantity, String imageUrl) {}
