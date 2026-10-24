package com.ecommerce.controller;

import com.ecommerce.dto.response.AdminDashboardResponse;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminDashboardController {
    private final AdminDashboardService adminDashboardService;

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardResponse> dashboard() {
        return ApiResponse.<AdminDashboardResponse>builder().code(1000)
                .result(adminDashboardService.getDashboard()).build();
    }
}
