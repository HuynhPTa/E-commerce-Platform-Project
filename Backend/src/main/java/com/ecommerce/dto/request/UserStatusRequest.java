package com.ecommerce.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserStatusRequest {
    // 1 = đang hoạt động, 0 = bị khoá
    @NotNull(message = "Thiếu trạng thái mới")
    @Min(value = 0, message = "Trạng thái chỉ nhận 0 hoặc 1")
    @Max(value = 1, message = "Trạng thái chỉ nhận 0 hoặc 1")
    private Integer status;
}
