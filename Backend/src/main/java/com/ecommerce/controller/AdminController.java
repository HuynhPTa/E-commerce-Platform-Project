package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/ping")
    public ApiResponse<String> ping() {
        return ApiResponse.<String>builder().code(1000).result("pong, bạn là admin").build();
    }
}