package com.ecommerce.dto.response;

import java.util.List;

public record ProductResponse(Integer id, String name, String description, String categoryId,
                              String shopId, String shopName, String thumbnailUrl,
                              double ratingAvg, int ratingCount, int soldCount,
                              List<ProductVariantResponse> variants) {}
