package com.ecommerce.controller;

import com.ecommerce.dto.request.UserStatusRequest;
import com.ecommerce.dto.response.AdminUserResponse;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminUserController {
    private final AdminUserService adminUserService;

    @GetMapping
    public ApiResponse<PageResponse<AdminUserResponse>> list(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<AdminUserResponse>>builder().code(1000)
                .result(adminUserService.list(role, status, q, page, size)).build();
    }

    // Khoá (0) / mở khoá (1) tài khoản người dùng
    @PatchMapping("/{id}/status")
    public ApiResponse<AdminUserResponse> updateStatus(@AuthenticationPrincipal Jwt jwt,
                                                       @PathVariable int id,
                                                       @Valid @RequestBody UserStatusRequest request) {
        return ApiResponse.<AdminUserResponse>builder().code(1000)
                .message(request.getStatus() == 0 ? "Đã khoá tài khoản" : "Đã mở khoá tài khoản")
                .result(adminUserService.updateStatus(id, request, jwt.getSubject())).build();
    }
}
