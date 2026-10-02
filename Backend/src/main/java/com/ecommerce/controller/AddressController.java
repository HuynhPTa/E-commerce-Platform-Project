package com.ecommerce.controller;

import com.ecommerce.dto.request.AddressRequest;
import com.ecommerce.dto.response.AddressResponse;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {
    private final AddressService addressService;

    @GetMapping
    public ApiResponse<List<AddressResponse>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.<List<AddressResponse>>builder()
                .code(1000).result(addressService.list(jwt.getSubject())).build();
    }

    @PostMapping
    public ApiResponse<AddressResponse> create(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody AddressRequest req) {
        return ApiResponse.<AddressResponse>builder()
                .code(1000).result(addressService.create(jwt.getSubject(), req)).build();
    }

    @PutMapping("/{id}")
    public ApiResponse<AddressResponse> update(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable int id,
                                               @Valid @RequestBody AddressRequest req) {
        return ApiResponse.<AddressResponse>builder()
                .code(1000).result(addressService.update(jwt.getSubject(), id, req)).build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable int id) {
        addressService.delete(jwt.getSubject(), id);
        return ApiResponse.<Void>builder().code(1000).message("Đã xoá địa chỉ").build();
    }

    @PutMapping("/{id}/default")
    public ApiResponse<AddressResponse> setDefault(@AuthenticationPrincipal Jwt jwt, @PathVariable int id) {
        return ApiResponse.<AddressResponse>builder()
                .code(1000).result(addressService.setDefault(jwt.getSubject(), id)).build();
    }
}