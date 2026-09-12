package com.ecommerce.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginResponse {
    boolean success;
    String message;
    String token;
    UserInfo userInfo;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class UserInfo {
        int id;
        String email;
        String fullName;
        String phone;
        String avatar;
    }
}