package com.ecommerce.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {
    String email;
    String password;
    String firstName;
    String lastName;
    String phone;
    LocalDate dateOfBirth;
}
