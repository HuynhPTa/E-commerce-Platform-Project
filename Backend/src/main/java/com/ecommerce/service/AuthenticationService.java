package com.ecommerce.service;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.response.LoginResponse;
import com.ecommerce.entity.User;
import com.ecommerce.repository.UserRepository;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {

    private static final long ACCESS_TOKEN_SECONDS = 60 * 60;            // 1 giờ
    private static final long REFRESH_TOKEN_SECONDS = 60 * 60 * 24 * 7;  // 7 ngày

    UserRepository userRepository;
    PasswordEncoder passwordEncoder; // FIX: mã hóa mật khẩu

    @NonFinal
    @Value("${jwt.signerKey}") // phải dài >= 64 ký tự (HS512)
    String signerKey;

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmailAndIsDelete(request.getEmail(), 0)) {
            throw new RuntimeException("Email đã tồn tại trên hệ thống!");
        }

        User newUser = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // FIX: không lưu plain text
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

        // FIX: so sánh bằng BCrypt thay vì equals()
        if (!passwordEncoder.matches(request.getPassword(), currentUser.getPassword())) {
            throw new RuntimeException("Tài khoản hoặc mật khẩu không chính xác!");
        }

        // FIX: gốc dùng biến "user" không tồn tại -> phải là currentUser
        String accessToken = generateToken(currentUser, false);

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
                .token(accessToken) // FIX: trả token thật thay vì "dummy-jwt-token"
                .userInfo(info)
                .build();
    }

    // FIX: hàm này được gọi nhưng chưa từng được viết
    public String generateToken(User user, boolean isRefresh) {
        long duration = isRefresh ? REFRESH_TOKEN_SECONDS : ACCESS_TOKEN_SECONDS;

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("ecommerce.com")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(duration, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", "USER") // SecurityConfig đọc claim "scope", prefix rỗng
                .claim("userId", user.getId())
                .build();

        JWSObject jws = new JWSObject(new JWSHeader(JWSAlgorithm.HS512), new Payload(claims.toJSONObject()));
        try {
            jws.sign(new MACSigner(signerKey.getBytes()));
            return jws.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Không thể tạo token", e);
        }
    }
}