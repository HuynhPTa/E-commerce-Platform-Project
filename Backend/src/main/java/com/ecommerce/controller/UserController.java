package com.ecommerce.controller;

import com.ecommerce.dto.request.UpdateProfileRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;


    @GetMapping
    public ApiResponse<UserResponse> getMe(@AuthenticationPrincipal Jwt jwt){
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(userService.getMyInfo(jwt.getSubject()))
                .build();

    }
    @PutMapping
    public ApiResponse<UserResponse> updateMe(@AuthenticationPrincipal Jwt jwt,
                                              @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(userService.updateMyInfo(jwt.getSubject(), request))
                .build();

    }

}
