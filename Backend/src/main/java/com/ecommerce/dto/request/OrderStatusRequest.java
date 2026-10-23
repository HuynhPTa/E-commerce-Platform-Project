package com.ecommerce.dto.request;

import com.ecommerce.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderStatusRequest {
    @NotNull(message = "Thiếu trạng thái mới")
    private OrderStatus status;
}
