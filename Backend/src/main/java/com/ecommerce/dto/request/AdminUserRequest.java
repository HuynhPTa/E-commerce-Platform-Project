package com.ecommerce.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminUserRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 255, message = "Email tối đa 255 ký tự")
    String email;

    // Bắt buộc khi tạo mới; để trống khi cập nhật nghĩa là giữ mật khẩu cũ.
    String password;

    @NotBlank(message = "Họ không được để trống")
    @Size(max = 120, message = "Họ tối đa 120 ký tự")
    String firstName;

    @NotBlank(message = "Tên không được để trống")
    @Size(max = 120, message = "Tên tối đa 120 ký tự")
    String lastName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    String phone;

    LocalDate dateOfBirth;

    String role;

    Integer status;
}
