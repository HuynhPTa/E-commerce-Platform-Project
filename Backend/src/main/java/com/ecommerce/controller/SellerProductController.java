package com.ecommerce.controller;

import com.ecommerce.dto.request.ProductCreateRequest;
import com.ecommerce.dto.request.ProductUpdateRequest;
import com.ecommerce.dto.request.VariantRequest;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/seller/products")
@RequiredArgsConstructor
public class SellerProductController {
    private final SellerProductService sellerProductService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SellerProductResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                     @Valid @RequestBody ProductCreateRequest request) {
        return ApiResponse.<SellerProductResponse>builder().code(1000)
                .message("Đã tạo sản phẩm")
                .result(sellerProductService.create(jwt.getSubject(), request)).build();
    }

    @GetMapping
    public ApiResponse<PageResponse<SellerProductResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.<PageResponse<SellerProductResponse>>builder().code(1000)
                .result(sellerProductService.list(jwt.getSubject(), q, status, page, size)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<SellerProductResponse> get(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        return ApiResponse.<SellerProductResponse>builder().code(1000)
                .result(sellerProductService.get(jwt.getSubject(), id)).build();
    }

    @PutMapping("/{id}")
    public ApiResponse<SellerProductResponse> update(@AuthenticationPrincipal Jwt jwt,
                                                     @PathVariable Integer id,
                                                     @Valid @RequestBody ProductUpdateRequest request) {
        return ApiResponse.<SellerProductResponse>builder().code(1000)
                .message("Đã cập nhật sản phẩm")
                .result(sellerProductService.update(jwt.getSubject(), id, request)).build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        sellerProductService.delete(jwt.getSubject(), id);
        return ApiResponse.<Void>builder().code(1000).message("Đã xoá sản phẩm").build();
    }

    @PostMapping("/{id}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductVariantResponse> addVariant(@AuthenticationPrincipal Jwt jwt,
                                                          @PathVariable Integer id,
                                                          @Valid @RequestBody VariantRequest request) {
        return ApiResponse.<ProductVariantResponse>builder().code(1000)
                .message("Đã thêm biến thể")
                .result(sellerProductService.addVariant(jwt.getSubject(), id, request)).build();
    }

    @PutMapping("/{id}/variants/{variantId}")
    public ApiResponse<ProductVariantResponse> updateVariant(@AuthenticationPrincipal Jwt jwt,
                                                             @PathVariable Integer id,
                                                             @PathVariable Integer variantId,
                                                             @Valid @RequestBody VariantRequest request) {
        return ApiResponse.<ProductVariantResponse>builder().code(1000)
                .message("Đã cập nhật biến thể")
                .result(sellerProductService.updateVariant(jwt.getSubject(), id, variantId, request)).build();
    }

    @DeleteMapping("/{id}/variants/{variantId}")
    public ApiResponse<Void> deleteVariant(@AuthenticationPrincipal Jwt jwt,
                                           @PathVariable Integer id,
                                           @PathVariable Integer variantId) {
        sellerProductService.deleteVariant(jwt.getSubject(), id, variantId);
        return ApiResponse.<Void>builder().code(1000).message("Đã xoá biến thể").build();
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductImageResponse> uploadImage(@AuthenticationPrincipal Jwt jwt,
                                                         @PathVariable Integer id,
                                                         @RequestParam("file") MultipartFile file) {
        return ApiResponse.<ProductImageResponse>builder().code(1000)
                .message("Đã upload ảnh")
                .result(sellerProductService.uploadImage(jwt.getSubject(), id, file)).build();
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ApiResponse<Void> deleteImage(@AuthenticationPrincipal Jwt jwt,
                                         @PathVariable Integer id,
                                         @PathVariable Integer imageId) {
        sellerProductService.deleteImage(jwt.getSubject(), id, imageId);
        return ApiResponse.<Void>builder().code(1000).message("Đã xoá ảnh").build();
    }
}
