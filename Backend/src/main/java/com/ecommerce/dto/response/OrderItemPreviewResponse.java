package com.ecommerce.dto.response;

import java.util.Map;

// Bản rút gọn của một dòng hàng, dùng cho thẻ đơn trong danh sách.
public record OrderItemPreviewResponse(int id, String productName,
                                       Map<String, Object> attributes, int quantity,
                                       String thumbnailUrl) {}
