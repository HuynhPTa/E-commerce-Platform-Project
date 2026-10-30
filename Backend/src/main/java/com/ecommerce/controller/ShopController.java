package com.ecommerce.controller;

import com.ecommerce.dto.request.ShopRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ShopResponse;
import com.ecommerce.service.ShopService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {
    private final ShopService shopService;

    // Đăng ký mở shop (hoặc gửi lại sau khi bị từ chối)
    @PostMapping
    public ApiResponse<ShopResponse> register(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ShopRequest req) {
        return ApiResponse.<ShopResponse>builder().code(1000)
                .message("Đã gửi đăng ký, vui lòng chờ Admin duyệt")
                .result(shopService.register(jwt.getSubject(), req)).build();
    }

    // Shop của người đang đăng nhập (404 SHOP_NOT_EXISTED nếu chưa đăng ký)
    @GetMapping("/me")
    public ApiResponse<ShopResponse> myShop(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.<ShopResponse>builder().code(1000).result(shopService.myShop(jwt.getSubject())).build();
    }

    // Cài đặt shop: chỉ sửa thông tin, không đổi trạng thái duyệt
    @PutMapping("/me")
    public ApiResponse<ShopResponse> updateMyShop(@AuthenticationPrincipal Jwt jwt,
                                                  @Valid @RequestBody ShopRequest req) {
        return ApiResponse.<ShopResponse>builder().code(1000)
                .message("Đã cập nhật thông tin shop")
                .result(shopService.updateMyShop(jwt.getSubject(), req)).build();
    }

    // Công khai (permitAll trong SecurityConfig); jwt có thể null khi khách chưa đăng nhập
    @GetMapping("/{id:\\d+}")
    public ApiResponse<ShopResponse> getById(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.<ShopResponse>builder().code(1000).result(shopService.getById(id, jwt)).build();
    }
}
