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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Sau khi Google/Facebook xác thực thành công:
 * - tìm user theo email, tạo mới nếu chưa có (đăng ký bằng mạng xã hội);
 * - cấp JWT của hệ thống rồi chuyển về frontend kèm token.
 *
 * Google trả các attribute phẳng (given_name, picture...), Facebook trả
 * name + picture dạng object lồng nhau nên phần đọc attribute phải chịu được cả hai.
 */
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
        String email = stringAttribute(oAuth2User, "email");
        if (email == null) {
            redirectError(response, "no_email");
            return;
        }
        email = email.trim().toLowerCase(Locale.ROOT);

        String avatar = avatarAttribute(oAuth2User);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.getIsDelete() != 0) {
            redirectError(response, "account_disabled");
            return;
        }

        if (user == null) {
            String[] name = splitName(stringAttribute(oAuth2User, "name"), email);
            String givenName = stringAttribute(oAuth2User, "given_name");
            String familyName = stringAttribute(oAuth2User, "family_name");
            user = User.builder()
                    .email(email)
                    // OAuth2 không có mật khẩu: lưu một chuỗi ngẫu nhiên đã băm, không dùng để đăng nhập
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstName(givenName != null ? givenName : name[0])
                    .lastName(familyName != null ? familyName : name[1])
                    .avatar(avatar)
                    .status(1)
                    .isDelete(0)
                    .admin(false)
                    .role("USER")
                    .build();
            user = userRepository.save(user);
        } else {
            // Bổ sung ảnh đại diện cho tài khoản cũ chưa có ảnh
            if (user.getAvatar() == null && avatar != null) {
                user.setAvatar(avatar);
                user = userRepository.save(user);
            }
        }

        if (user.getStatus() == 0) {
            redirectError(response, "account_disabled");
            return;
        }

        String token = authenticationService.generateToken(user, false);
        String redirectUrl = frontendUrl + "/oauth2/redirect?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }

    private void redirectError(HttpServletResponse response, String code) throws IOException {
        response.sendRedirect(frontendUrl + "/login?error=" + code);
    }

    private static String stringAttribute(OAuth2User user, String name) {
        Object value = user.getAttribute(name);
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        return null;
    }

    // Google: picture = "https://..." | Facebook: picture = { data: { url: "..." } }
    private static String avatarAttribute(OAuth2User user) {
        Object picture = user.getAttribute("picture");
        if (picture instanceof String url && !url.isBlank()) {
            return url;
        }
        if (picture instanceof Map<?, ?> map && map.get("data") instanceof Map<?, ?> data) {
            Object url = data.get("url");
            if (url instanceof String text && !text.isBlank()) {
                return text;
            }
        }
        return null;
    }

    // Tên đầy đủ -> [firstName, lastName] để hiển thị giống tài khoản thường
    private static String[] splitName(String fullName, String email) {
        String name = fullName == null ? "" : fullName.trim();
        if (name.isEmpty()) {
            int at = email.indexOf('@');
            name = at > 0 ? email.substring(0, at) : email;
        }
        int space = name.indexOf(' ');
        return space < 0
                ? new String[]{name, ""}
                : new String[]{name.substring(0, space), name.substring(space + 1).trim()};
    }
}
