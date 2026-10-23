package com.ecommerce.config;

import com.ecommerce.entity.User;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin.email:}")
    private String adminEmail;

    @Value("${app.seed.admin.password:}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            log.info("Bỏ qua seed admin (chưa cấu hình ADMIN_SEED_PASSWORD)");
            return;
        }
        // Idempotent: đã có tài khoản thì không tạo lại, cũng không tự đổi quyền của ai
        if (userRepository.existsByEmailAndIsDelete(adminEmail, 0)) {
            log.info("Tài khoản admin {} đã tồn tại, bỏ qua", adminEmail);
            return;
        }
        User admin = User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .firstName("Admin")
                .lastName("System")
                .avatar("default-avatar.png")
                .status(1)
                .isDelete(0)
                .admin(true)
                .role("ADMIN")
                .build();
        userRepository.save(admin);
        log.info("Đã tạo tài khoản admin {}", adminEmail);
    }
}