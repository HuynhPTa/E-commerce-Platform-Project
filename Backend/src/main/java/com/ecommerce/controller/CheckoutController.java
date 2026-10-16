package com.ecommerce.controller;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.CheckoutResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final UserRepository userRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CheckoutResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        return ApiResponse.<CheckoutResponse>builder()
                .code(HttpStatus.CREATED.value())
                .message("Đặt hàng thành công")
                .result(checkoutService.checkout(currentUserId(), request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CheckoutResponse> getResult(@PathVariable int id) {
        return ApiResponse.<CheckoutResponse>builder()
                .code(HttpStatus.OK.value())
                .result(checkoutService.getResult(currentUserId(), id))
                .build();
    }

    /**
     * Lấy ID người dùng hiện tại từ Spring Security Context.
     */
    private int currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        // Gọi findByEmailAndIsDelete với isDelete = 0 (tài khoản còn hoạt động)
        return userRepository.findByEmailAndIsDelete(auth.getName(), 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))
                .getId();
    }
}