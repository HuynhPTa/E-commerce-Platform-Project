package com.ecommerce.dto.response;

import java.time.LocalDateTime;

public record ReviewResponse(Integer id, Integer orderItemId, int rating, String comment,
                             String userName, String userAvatar, LocalDateTime createdAt) {
}
