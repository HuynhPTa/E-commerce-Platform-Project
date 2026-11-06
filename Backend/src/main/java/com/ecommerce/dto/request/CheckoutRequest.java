package com.ecommerce.dto.request;

import com.ecommerce.entity.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutRequest {
    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(max = 120, message = "Tên người nhận tối đa 120 ký tự")
    String recipientName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại phải gồm 9 đến 11 chữ số")
    String phone;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    String fullAddress;

    @NotBlank(message = "Vui lòng chọn tỉnh/thành phố")
    @Size(max = 80, message = "Tỉnh/thành phố tối đa 80 ký tự")
    String province;

    @NotNull(message = "Vui lòng chọn cổng thanh toán")
    PaymentMethod paymentMethod;

    /** Không bắt buộc: rỗng/null = thanh toán toàn bộ giỏ hàng. */
    List<Integer> cartItemIds;

    /**
     * Khoá chống tạo trùng đơn khi người dùng bấm đặt hàng nhiều lần.
     * Không bắt buộc với client cũ; nếu có thì phải ngắn gọn và duy nhất mỗi lượt đặt.
     */
    @Size(max = 64, message = "Khoá chống trùng tối đa 64 ký tự")
    String idempotencyKey;
}
