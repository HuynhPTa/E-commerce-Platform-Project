package com.ecommerce.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record SellerProductResponse(Integer id, String name, String description, String categoryId,
                                    String categoryName, String shopId, String shopName, String thumbnailUrl,
                                    String status, double ratingAvg, int ratingCount, int soldCount,
                                    LocalDateTime createdAt, List<ProductVariantResponse> variants,
                                    List<ProductImageResponse> images) {}
