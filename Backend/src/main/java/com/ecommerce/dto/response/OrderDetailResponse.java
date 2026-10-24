package com.ecommerce.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record OrderDetailResponse(int id, int checkoutSessionId, int shopId, String shopName,
                                  int buyerId, String buyerName, String buyerEmail,
                                  String status, String paymentMethod,
                                  Map<String, Object> shippingAddress,
                                  int subtotalMinor, int shippingFeeMinor, int totalMinor,
                                  LocalDateTime createdAt, LocalDateTime updatedAt,
                                  List<OrderItemResponse> items) {}
