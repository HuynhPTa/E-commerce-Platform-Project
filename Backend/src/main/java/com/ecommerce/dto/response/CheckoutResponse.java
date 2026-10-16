package com.ecommerce.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutResponse {
    int checkoutSessionId;
    String status;
    String paymentMethod;
    int totalAmountMinor;
    List<OrderSummary> orders;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class OrderSummary {
        int orderId;
        int shopId;
        String status;
        int itemCount;
        int subtotalMinor;
        int totalMinor;
    }
}
