package com.ecommerce.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ProductCreateRequest {
    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 200, message = "Tên sản phẩm tối đa 200 ký tự")
    private String name;

    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    // Nhận id (dạng số) hoặc slug của danh mục đã tồn tại
    @NotBlank(message = "Danh mục không được để trống")
    @Size(max = 80, message = "Danh mục không hợp lệ")
    private String categoryId;

    @Valid
    private List<VariantRequest> variants;
}
