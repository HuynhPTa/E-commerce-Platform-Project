package com.ecommerce.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

@Data
public class VariantRequest {
    @Size(max = 64, message = "SKU tối đa 64 ký tự")
    private String sku;

    // vd { "color": "Đen", "size": "L" }
    private Map<String, String> attributes;

    @Min(value = 0, message = "Giá không được âm")
    private Long priceMinor;

    @Min(value = 0, message = "Tồn kho không được âm")
    private Integer stockQuantity;

    @Size(max = 512, message = "Đường dẫn ảnh quá dài")
    private String imageUrl;
}
