package com.ecommerce.service;

import com.ecommerce.entity.User;
import com.ecommerce.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

// FIX: logic này nằm nhầm trong CustomOAuth2UserService; chuyển về đúng handler
@Component
@RequiredArgsConstructor
public class CustomOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AuthenticationService authenticationService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        if (email == null) {
            response.sendRedirect(frontendUrl + "/login?error=no_email");
            return;
        }

        // FIX: repository không có findByEmail -> dùng findByEmailAndIsDelete; chưa có thì tạo mới
        User user = userRepository.findByEmailAndIsDelete(email, 0).orElseGet(() -> {
            String name = oAuth2User.getAttribute("name");
            User u = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstName(oAuth2User.getAttribute("given_name") != null
                            ? oAuth2User.getAttribute("given_name") : name)
                    .lastName(oAuth2User.getAttribute("family_name") != null
                            ? oAuth2User.getAttribute("family_name") : "")
                    .avatar(oAuth2User.getAttribute("picture") != null
                            ? oAuth2User.getAttribute("picture") : "default-avatar.png")
                    .status(1)
                    .isDelete(0)
                    .build();
            return userRepository.save(u);
        });

        if (user.getStatus() == 0) {
            response.sendRedirect(frontendUrl + "/login?error=account_disabled");
            return;
        }

        String token = authenticationService.generateToken(user, false);
        response.sendRedirect(frontendUrl + "/oauth2/redirect?token=" + token);
    }
}