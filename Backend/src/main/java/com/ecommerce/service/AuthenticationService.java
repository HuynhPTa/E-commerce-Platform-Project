package com.ecommerce.service;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.response.LoginResponse;
import com.ecommerce.entity.User;
import com.ecommerce.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {

    UserRepository userRepository;

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmailAndIsDelete(request.getEmail(), 0)) {
            throw new RuntimeException("Email đã tồn tại trên hệ thống!");
        }

        User newUser = User.builder()
                .email(request.getEmail())
                .password(request.getPassword())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .avatar("default-avatar.png")
                .status(1)
                .isDelete(0)
                .build();

        userRepository.save(newUser);
        return "Đăng ký tài khoản thành công!";
    }

    public LoginResponse authenticate(LoginRequest request) {
        User currentUser = userRepository.findByEmailAndIsDelete(request.getEmail(), 0)
                .orElseThrow(() -> new RuntimeException("Tài khoản hoặc mật khẩu không chính xác!"));

        if (currentUser.getStatus() == 0) {
            throw new RuntimeException("Tài khoản của bạn đã bị vô hiệu hóa!");
        }

        if (!currentUser.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Tài khoản hoặc mật khẩu không chính xác!");
        }

        LoginResponse.UserInfo info = LoginResponse.UserInfo.builder()
                .id(currentUser.getId())
                .email(currentUser.getEmail())
                .fullName(currentUser.getFirstName() + " " + currentUser.getLastName())
                .phone(currentUser.getPhone())
                .avatar(currentUser.getAvatar())
                .build();

        return LoginResponse.builder()
                .success(true)
                .message("Đăng nhập thành công!")
                .token("dummy-jwt-token")
                .userInfo(info)
                .build();
    }
}