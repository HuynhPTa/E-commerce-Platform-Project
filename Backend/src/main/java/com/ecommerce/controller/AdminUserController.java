package com.ecommerce.controller;

import com.ecommerce.dto.request.AdminUserRequest;
import com.ecommerce.dto.request.UserStatusRequest;
import com.ecommerce.dto.response.AdminUserDetailResponse;
import com.ecommerce.dto.response.AdminUserResponse;
import com.ecommerce.dto.response.AdminUserStatsResponse;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @GetMapping("/stats")
    public ApiResponse<AdminUserStatsResponse> stats() {
        return ApiResponse.<AdminUserStatsResponse>builder().code(1000)
                .result(adminUserService.stats()).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<AdminUserDetailResponse> detail(@PathVariable int id) {
        return ApiResponse.<AdminUserDetailResponse>builder().code(1000)
                .result(adminUserService.detail(id)).build();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AdminUserResponse> create(@Valid @RequestBody AdminUserRequest request) {
        return ApiResponse.<AdminUserResponse>builder().code(1000)
                .message("Đã tạo tài khoản")
                .result(adminUserService.create(request)).build();
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminUserResponse> update(@AuthenticationPrincipal Jwt jwt,
                                                 @PathVariable int id,
                                                 @Valid @RequestBody AdminUserRequest request) {
        return ApiResponse.<AdminUserResponse>builder().code(1000)
                .message("Đã cập nhật tài khoản")
                .result(adminUserService.update(id, request, jwt.getSubject())).build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable int id) {
        adminUserService.delete(id, jwt.getSubject());
        return ApiResponse.<Void>builder().code(1000)
                .message("Đã xoá tài khoản").build();
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
