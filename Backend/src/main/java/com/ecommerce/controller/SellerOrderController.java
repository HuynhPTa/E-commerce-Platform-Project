package com.ecommerce.controller;

import com.ecommerce.dto.request.OrderStatusRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.service.SellerOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
public class SellerOrderController {
    private final SellerOrderService sellerOrderService;

    @GetMapping
    public ApiResponse<PageResponse<OrderSummaryResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<OrderSummaryResponse>>builder().code(1000)
                .result(sellerOrderService.list(jwt.getSubject(), status, q, page, size)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDetailResponse> detail(@AuthenticationPrincipal Jwt jwt,
                                                   @PathVariable int id) {
        return ApiResponse.<OrderDetailResponse>builder().code(1000)
                .result(sellerOrderService.detail(jwt.getSubject(), id)).build();
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<OrderDetailResponse> updateStatus(@AuthenticationPrincipal Jwt jwt,
                                                         @PathVariable int id,
                                                         @Valid @RequestBody OrderStatusRequest request) {
        return ApiResponse.<OrderDetailResponse>builder().code(1000)
                .message("Đã cập nhật trạng thái đơn hàng")
                .result(sellerOrderService.updateStatus(jwt.getSubject(), id, request)).build();
    }
}
