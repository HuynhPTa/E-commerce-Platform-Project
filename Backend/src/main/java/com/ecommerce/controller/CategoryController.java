package com.ecommerce.controller;

import com.ecommerce.dto.request.CategoryRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.CategoryResponse;
import com.ecommerce.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    // Công khai: cây danh mục lồng nhau
    @GetMapping
    public ApiResponse<List<CategoryResponse>> tree() {
        return ApiResponse.<List<CategoryResponse>>builder().code(1000).result(categoryService.tree()).build();
    }

    // Công khai: danh sách phẳng theo thứ tự cây, có depth
    @GetMapping("/flat")
    public ApiResponse<List<CategoryResponse>> flat() {
        return ApiResponse.<List<CategoryResponse>>builder().code(1000).result(categoryService.flat()).build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<CategoryResponse> create(@Valid @RequestBody CategoryRequest req) {
        return ApiResponse.<CategoryResponse>builder().code(1000).result(categoryService.create(req)).build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<CategoryResponse> update(@PathVariable Integer id, @Valid @RequestBody CategoryRequest req) {
        return ApiResponse.<CategoryResponse>builder().code(1000).result(categoryService.update(id, req)).build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        categoryService.delete(id);
        return ApiResponse.<Void>builder().code(1000).message("Đã xoá danh mục").build();
    }
}
