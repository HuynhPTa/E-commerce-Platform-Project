package com.ecommerce.dto.response;

import java.time.LocalDate;

public record AdminUserResponse(int id, String email, String firstName, String lastName,
                                String fullName, String phone, String avatar, String role,
                                int status, int isDelete, LocalDate dateOfBirth,
                                Integer shopId, String shopName, String shopStatus) {}
