package com.ecommerce.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 120, message = "Tên danh mục tối đa 120 ký tự")
    private String name;

    // Bỏ trống thì BE tự sinh từ tên
    @Size(max = 140, message = "Slug tối đa 140 ký tự")
    @Pattern(regexp = "^$|^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang")
    private String slug;

    // null = danh mục gốc
    private Integer parentId;

    @Size(max = 40)
    private String icon;

    @Min(value = 0, message = "Thứ tự hiển thị phải >= 0")
    private int sortOrder;
}
