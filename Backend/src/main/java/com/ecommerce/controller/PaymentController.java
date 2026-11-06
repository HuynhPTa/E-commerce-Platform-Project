package com.ecommerce.controller;

import com.ecommerce.dto.request.CreatePaymentRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PaymentUrlResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/create-url")
    public ApiResponse<PaymentUrlResponse> createUrl(@AuthenticationPrincipal Jwt jwt,
                                                     @Valid @RequestBody CreatePaymentRequest request,
                                                     HttpServletRequest httpRequest) {
        String clientIp = resolveClientIp(httpRequest);
        return ApiResponse.<PaymentUrlResponse>builder()
                .code(1000)
                .message("Đã tạo URL thanh toán")
                .result(paymentService.createPaymentUrl(jwt.getSubject(), request, clientIp))
                .build();
    }

    @GetMapping("/vnpay/return")
    public void vnpayReturn(@RequestParam Map<String, String> params,
                            HttpServletResponse response) throws IOException {
        try {
            PaymentService.PaymentResult result = paymentService.processVnPay(params);
            redirectToResult(response, result.checkoutSessionId());
        } catch (AppException ex) {
            redirectToOrders(response);
        }
    }

    @GetMapping("/vnpay/ipn")
    public Map<String, String> vnpayIpn(@RequestParam Map<String, String> params) {
        try {
            paymentService.processVnPay(params);
            // VNPay cần RspCode 00 để dừng retry, kể cả giao dịch thất bại nhưng chữ ký hợp lệ.
            return Map.of("RspCode", "00", "Message", "Confirm Success");
        } catch (AppException ex) {
            return switch (ex.getErrorCode()) {
                case PAYMENT_INVALID_SIGNATURE -> Map.of("RspCode", "97", "Message", "Invalid signature");
                case PAYMENT_AMOUNT_MISMATCH -> Map.of("RspCode", "04", "Message", "Invalid amount");
                case PAYMENT_NOT_FOUND -> Map.of("RspCode", "01", "Message", "Order not found");
                default -> Map.of("RspCode", "99", "Message", "Unknown error");
            };
        }
    }

    @GetMapping("/momo/return")
    public void momoReturn(@RequestParam Map<String, String> params,
                           HttpServletResponse response) throws IOException {
        try {
            PaymentService.PaymentResult result = paymentService.processMomo(params);
            redirectToResult(response, result.checkoutSessionId());
        } catch (AppException ex) {
            redirectToOrders(response);
        }
    }

    @PostMapping("/momo/ipn")
    public Map<String, Object> momoIpn(@RequestBody Map<String, Object> body) {
        Map<String, String> params = toStringMap(body);
        try {
            paymentService.processMomo(params);
            return Map.of("resultCode", 0, "message", "Success");
        } catch (AppException ex) {
            return Map.of("resultCode", 1, "message", ex.getErrorCode().getMessage());
        }
    }

    private void redirectToResult(HttpServletResponse response, int checkoutSessionId) throws IOException {
        if (checkoutSessionId <= 0) {
            redirectToOrders(response);
            return;
        }
        response.sendRedirect(frontendUrl + "/checkout/result?checkoutId=" + checkoutSessionId);
    }

    private void redirectToOrders(HttpServletResponse response) throws IOException {
        response.sendRedirect(frontendUrl + "/orders");
    }

    private Map<String, String> toStringMap(Map<String, Object> body) {
        Map<String, String> params = new LinkedHashMap<>();
        body.forEach((key, value) -> params.put(key, value == null ? "" : String.valueOf(value)));
        return params;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
