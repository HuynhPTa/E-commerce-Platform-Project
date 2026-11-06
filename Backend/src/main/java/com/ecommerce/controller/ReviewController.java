package com.ecommerce.controller;

import com.ecommerce.dto.request.ReviewCreateRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ReviewEligibilityResponse;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    @PostMapping("/api/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> create(@Valid @RequestBody ReviewCreateRequest request) {
        return ApiResponse.<ReviewResponse>builder()
                .code(HttpStatus.CREATED.value())
                .message("Đánh giá sản phẩm thành công")
                .result(reviewService.create(currentUserId(), request))
                .build();
    }

    /** Danh sách đánh giá công khai của một sản phẩm. */
    @GetMapping("/api/products/{productId}/reviews")
    public ApiResponse<PageResponse<ReviewResponse>> listByProduct(
            @PathVariable int productId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ApiResponse.<PageResponse<ReviewResponse>>builder()
                .code(1000)
                .result(reviewService.listByProduct(productId, page, size))
                .build();
    }

    /** Kiểm tra người dùng hiện tại có thể đánh giá sản phẩm này không. */
    @GetMapping("/api/products/{productId}/review-eligibility")
    public ApiResponse<ReviewEligibilityResponse> eligibility(@PathVariable int productId) {
        return ApiResponse.<ReviewEligibilityResponse>builder()
                .code(1000)
                .result(reviewService.getEligibility(currentUserId(), productId))
                .build();
    }

    private int currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userRepository.findByEmailAndIsDelete(auth.getName(), 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))
                .getId();
    }
}
