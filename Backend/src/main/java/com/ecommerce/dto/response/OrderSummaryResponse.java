package com.ecommerce.dto.response;

import java.time.LocalDateTime;

// Dùng chung cho danh sách đơn ở Admin và Kênh người bán
public record OrderSummaryResponse(int id, int shopId, String shopName,
                                   int buyerId, String buyerName, String buyerEmail,
                                   String status, int itemCount,
                                   int subtotalMinor, int shippingFeeMinor, int totalMinor,
                                   String paymentMethod, LocalDateTime createdAt) {}
