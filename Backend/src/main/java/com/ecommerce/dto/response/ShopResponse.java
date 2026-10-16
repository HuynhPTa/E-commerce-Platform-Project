package com.ecommerce.dto.response;

import java.time.LocalDateTime;

// ownerEmail / phone / pickupAddress / statusNote chỉ trả về cho chủ shop và Admin (null với khách)
public record ShopResponse(Integer id, String name, String description, String logoUrl,
                           String status, String statusNote, String phone, String pickupAddress,
                           Integer ownerId, String ownerName, String ownerEmail,
                           long productCount, LocalDateTime createdAt, LocalDateTime reviewedAt) {}
