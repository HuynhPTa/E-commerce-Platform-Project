package com.ecommerce.dto.response;

public record PaymentUrlResponse(int paymentId, int checkoutSessionId,
                                 String provider, String redirectUrl) {
}
