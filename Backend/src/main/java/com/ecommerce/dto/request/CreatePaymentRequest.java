package com.ecommerce.dto.request;

import com.ecommerce.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentRequest(
        @NotNull(message = "Thiếu mã phiên thanh toán")
        Integer checkoutSessionId,

        @NotNull(message = "Vui lòng chọn cổng thanh toán")
        PaymentMethod provider
) {
}
