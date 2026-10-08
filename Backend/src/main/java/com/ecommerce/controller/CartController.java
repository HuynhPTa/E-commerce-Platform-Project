package com.ecommerce.controller;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.request.UpdateCartItemRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.CartItemResponse;
import com.ecommerce.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    public ApiResponse<List<CartItemResponse>> getCart(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.<List<CartItemResponse>>builder().code(1000)
                .result(cartService.getCart(jwt.getSubject())).build();
    }

    @PostMapping
    public ApiResponse<CartItemResponse> add(@AuthenticationPrincipal Jwt jwt,
                                             @Valid @RequestBody CartItemRequest request) {
        return ApiResponse.<CartItemResponse>builder().code(1000)
                .result(cartService.add(jwt.getSubject(), request)).build();
    }

    @PutMapping("/{itemId}")
    public ApiResponse<CartItemResponse> update(@AuthenticationPrincipal Jwt jwt,
                                                @PathVariable Integer itemId,
                                                @Valid @RequestBody UpdateCartItemRequest request) {
        return ApiResponse.<CartItemResponse>builder().code(1000)
                .result(cartService.update(jwt.getSubject(), itemId, request.getQuantity())).build();
    }

    @DeleteMapping("/{itemId}")
    public ApiResponse<Void> remove(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer itemId) {
        cartService.remove(jwt.getSubject(), itemId);
        return ApiResponse.<Void>builder().code(1000).message("Cart item removed").build();
    }
}
