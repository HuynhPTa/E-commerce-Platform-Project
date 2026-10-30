package com.ecommerce.dto.response;

import java.time.LocalDateTime;

// Một mốc trạng thái trong Order Timeline
public record OrderStatusEventResponse(String status, LocalDateTime changedAt) {}
