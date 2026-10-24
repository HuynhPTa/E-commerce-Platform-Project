package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.SellerDashboardResponse;
import com.ecommerce.service.SellerOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerDashboardController {
    private final SellerOrderService sellerOrderService;

    @GetMapping("/dashboard")
    public ApiResponse<SellerDashboardResponse> dashboard(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.<SellerDashboardResponse>builder().code(1000)
                .result(sellerOrderService.dashboard(jwt.getSubject())).build();
    }
}
