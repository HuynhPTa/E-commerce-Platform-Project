package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.service.BuyerOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Đơn hàng của người mua đang đăng nhập
@RestController
@RequestMapping("/api/orders/me")
@RequiredArgsConstructor
public class OrderController {
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

    @GetMapping("/status-counts")
    public ApiResponse<Map<String, Long>> statusCounts(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.<Map<String, Long>>builder().code(1000)
                .result(buyerOrderService.statusCounts(jwt.getSubject())).build();
    }

    @GetMapping("/{id:\\d+}")
    public ApiResponse<OrderDetailResponse> detail(@AuthenticationPrincipal Jwt jwt, @PathVariable int id) {
        return ApiResponse.<OrderDetailResponse>builder().code(1000)
                .result(buyerOrderService.detail(jwt.getSubject(), id)).build();
    }
}
