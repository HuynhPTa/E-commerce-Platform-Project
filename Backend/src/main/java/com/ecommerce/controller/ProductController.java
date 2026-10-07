package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductResponse>> search(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String q) {
        return ApiResponse.<PageResponse<ProductResponse>>builder().code(1000)
                .result(productService.search(category, minPrice, maxPrice, sort, page, size, q)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getById(@PathVariable Integer id) {
        return ApiResponse.<ProductResponse>builder().code(1000)
                .result(productService.getById(id)).build();
    }
}
