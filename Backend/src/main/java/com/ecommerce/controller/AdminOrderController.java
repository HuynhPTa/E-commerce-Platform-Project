package com.ecommerce.controller;

import com.ecommerce.dto.request.OrderStatusRequest;
import com.ecommerce.dto.response.AdminOrderStatsResponse;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.service.AdminOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminOrderController {
    private final AdminOrderService adminOrderService;

    @GetMapping
    public ApiResponse<PageResponse<OrderSummaryResponse>> list(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<OrderSummaryResponse>>builder().code(1000)
                .result(adminOrderService.list(status, q, page, size)).build();
    }

    @GetMapping("/stats")
    public ApiResponse<AdminOrderStatsResponse> stats() {
        return ApiResponse.<AdminOrderStatsResponse>builder().code(1000)
                .result(adminOrderService.stats()).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDetailResponse> detail(@PathVariable int id) {
        return ApiResponse.<OrderDetailResponse>builder().code(1000)
                .result(adminOrderService.detail(id)).build();
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<OrderDetailResponse> updateStatus(@PathVariable int id,
                                                         @Valid @RequestBody OrderStatusRequest request) {
        return ApiResponse.<OrderDetailResponse>builder().code(1000)
                .message("Đã cập nhật trạng thái đơn hàng")
                .result(adminOrderService.updateStatus(id, request)).build();
    }
}
