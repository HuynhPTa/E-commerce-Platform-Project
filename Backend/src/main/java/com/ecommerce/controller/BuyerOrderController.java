package com.ecommerce.controller;

import com.ecommerce.dto.request.AddressRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.service.BuyerOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class BuyerOrderController {
    private final BuyerOrderService buyerOrderService;

    @GetMapping
    public ApiResponse<PageResponse<OrderSummaryResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<OrderSummaryResponse>>builder().code(1000)
                .result(buyerOrderService.list(jwt.getSubject(), status, page, size)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDetailResponse> detail(@AuthenticationPrincipal Jwt jwt,
                                                   @PathVariable int id) {
        return ApiResponse.<OrderDetailResponse>builder().code(1000)
                .result(buyerOrderService.detail(jwt.getSubject(), id)).build();
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderDetailResponse> cancel(@AuthenticationPrincipal Jwt jwt,
                                                    @PathVariable int id) {
        return ApiResponse.<OrderDetailResponse>builder().code(1000)
                .message("Đã huỷ đơn hàng")
                .result(buyerOrderService.cancel(jwt.getSubject(), id)).build();
    }

    @PatchMapping("/{id}/shipping")
    public ApiResponse<OrderDetailResponse> updateShipping(@AuthenticationPrincipal Jwt jwt,
                                                           @PathVariable int id,
                                                           @Valid @RequestBody AddressRequest request) {
        return ApiResponse.<OrderDetailResponse>builder().code(1000)
                .message("Đã cập nhật thông tin nhận hàng")
                .result(buyerOrderService.updateShipping(jwt.getSubject(), id, request)).build();
    }
}
