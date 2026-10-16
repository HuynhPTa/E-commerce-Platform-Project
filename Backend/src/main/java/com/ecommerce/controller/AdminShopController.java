package com.ecommerce.controller;

import com.ecommerce.dto.request.ShopStatusRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ShopResponse;
import com.ecommerce.entity.ShopStatus;
import com.ecommerce.service.ShopService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/shops")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")   // áp dụng cho mọi endpoint trong controller
public class AdminShopController {
    private final ShopService shopService;

    @GetMapping
    public ApiResponse<PageResponse<ShopResponse>> list(
            @RequestParam(required = false) ShopStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<ShopResponse>>builder().code(1000)
                .result(shopService.adminSearch(status, q, page, size)).build();
    }

    @GetMapping("/summary")
    public ApiResponse<Map<String, Long>> summary() {
        return ApiResponse.<Map<String, Long>>builder().code(1000).result(shopService.summary()).build();
    }

    // Duyệt / từ chối / khoá / mở khoá shop
    @PatchMapping("/{id}/status")
    public ApiResponse<ShopResponse> updateStatus(@PathVariable Integer id, @Valid @RequestBody ShopStatusRequest req) {
        return ApiResponse.<ShopResponse>builder().code(1000)
                .result(shopService.updateStatus(id, req)).build();
    }
}
