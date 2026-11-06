package com.ecommerce.controller;

import com.ecommerce.dto.request.ProductCreateRequest;
import com.ecommerce.dto.request.ProductUpdateRequest;
import com.ecommerce.dto.request.VariantRequest;
import com.ecommerce.dto.response.AdminProductStatsResponse;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductImageResponse;
import com.ecommerce.dto.response.ProductVariantResponse;
import com.ecommerce.dto.response.SellerProductResponse;
import com.ecommerce.service.SellerProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * API quản trị sản phẩm cho website single-brand.
 * Dùng chung nghiệp vụ với seller nhưng không giới hạn theo shop của người gọi.
 */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminProductController {
    private final SellerProductService productService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SellerProductResponse> create(@Valid @RequestBody ProductCreateRequest request) {
        return ApiResponse.<SellerProductResponse>builder().code(1000)
                .message("Đã tạo sản phẩm")
                .result(productService.createForAdmin(request)).build();
    }

    @GetMapping
    public ApiResponse<PageResponse<SellerProductResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.<PageResponse<SellerProductResponse>>builder().code(1000)
                .result(productService.listForAdmin(q, status, page, size)).build();
    }

    @GetMapping("/stats")
    public ApiResponse<AdminProductStatsResponse> stats() {
        return ApiResponse.<AdminProductStatsResponse>builder().code(1000)
                .result(productService.statsForAdmin()).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<SellerProductResponse> get(@PathVariable Integer id) {
        return ApiResponse.<SellerProductResponse>builder().code(1000)
                .result(productService.getForAdmin(id)).build();
    }

    @PutMapping("/{id}")
    public ApiResponse<SellerProductResponse> update(@PathVariable Integer id,
                                                     @Valid @RequestBody ProductUpdateRequest request) {
        return ApiResponse.<SellerProductResponse>builder().code(1000)
                .message("Đã cập nhật sản phẩm")
                .result(productService.updateForAdmin(id, request)).build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        productService.deleteForAdmin(id);
        return ApiResponse.<Void>builder().code(1000).message("Đã xoá sản phẩm").build();
    }

    @PostMapping("/{id}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductVariantResponse> addVariant(@PathVariable Integer id,
                                                          @Valid @RequestBody VariantRequest request) {
        return ApiResponse.<ProductVariantResponse>builder().code(1000)
                .message("Đã thêm biến thể")
                .result(productService.addVariantForAdmin(id, request)).build();
    }

    @PutMapping("/{id}/variants/{variantId}")
    public ApiResponse<ProductVariantResponse> updateVariant(@PathVariable Integer id,
                                                             @PathVariable Integer variantId,
                                                             @Valid @RequestBody VariantRequest request) {
        return ApiResponse.<ProductVariantResponse>builder().code(1000)
                .message("Đã cập nhật biến thể")
                .result(productService.updateVariantForAdmin(id, variantId, request)).build();
    }

    @DeleteMapping("/{id}/variants/{variantId}")
    public ApiResponse<Void> deleteVariant(@PathVariable Integer id, @PathVariable Integer variantId) {
        productService.deleteVariantForAdmin(id, variantId);
        return ApiResponse.<Void>builder().code(1000).message("Đã xoá biến thể").build();
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductImageResponse> uploadImage(@PathVariable Integer id,
                                                         @RequestParam("file") MultipartFile file) {
        return ApiResponse.<ProductImageResponse>builder().code(1000)
                .message("Đã upload ảnh")
                .result(productService.uploadImageForAdmin(id, file)).build();
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ApiResponse<Void> deleteImage(@PathVariable Integer id, @PathVariable Integer imageId) {
        productService.deleteImageForAdmin(id, imageId);
        return ApiResponse.<Void>builder().code(1000).message("Đã xoá ảnh").build();
    }
}
