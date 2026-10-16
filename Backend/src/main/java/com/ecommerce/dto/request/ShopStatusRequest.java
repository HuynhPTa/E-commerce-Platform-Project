package com.ecommerce.dto.request;

import com.ecommerce.entity.ShopStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ShopStatusRequest {
    @NotNull(message = "Thiếu trạng thái mới")
    private ShopStatus status;

    // Bắt buộc khi từ chối / khoá (kiểm tra ở service)
    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;
}
