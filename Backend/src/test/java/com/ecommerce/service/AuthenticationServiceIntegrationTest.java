package com.ecommerce.service;

import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AuthenticationService - đăng ký và thu hồi token")
class AuthenticationServiceIntegrationTest {
    private static final String ACTIVE_EMAIL = "auth-active@test.local";
    private static final String SOFT_DELETED_EMAIL = "auth-soft@test.local";
    private static final String JWT_EMAIL = "auth-jwt@test.local";
    private static final String NEW_EMAIL = "auth-new@test.local";

    @Autowired
    private AuthenticationService authenticationService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanOwnUsers() {
        deleteUser(ACTIVE_EMAIL);
        deleteUser(SOFT_DELETED_EMAIL);
        deleteUser(JWT_EMAIL);
        deleteUser(NEW_EMAIL);
    }

    @Test
    @DisplayName("Email đã tồn tại hoặc đã xoá mềm bị từ chối khi đăng ký")
    void dangKyTrungEmail() {
        userRepository.save(user(ACTIVE_EMAIL, 0));
        userRepository.save(user(SOFT_DELETED_EMAIL, 1));

        assertThatThrownBy(() -> authenticationService.register(registerRequest(
                "  AUTH-ACTIVE@TEST.LOCAL  ")))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.EMAIL_EXISTED));

        assertThatThrownBy(() -> authenticationService.register(registerRequest(SOFT_DELETED_EMAIL)))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.EMAIL_EXISTED));
    }

    @Test
    @DisplayName("Đăng ký trùng email trả HTTP 409")
    void dangKyTrungEmailTra409() throws Exception {
        userRepository.save(user(ACTIVE_EMAIL, 0));
        userRepository.save(user(SOFT_DELETED_EMAIL, 1));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(ACTIVE_EMAIL, "Secret123", "0901234567")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.EMAIL_EXISTED.getCode()));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(SOFT_DELETED_EMAIL, "Secret123", "0901234567")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.EMAIL_EXISTED.getCode()));
    }

    @Test
    @DisplayName("Đăng ký sai email/mật khẩu/số điện thoại trả HTTP 400")
    void dangKySaiDuLieuTra400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("khong-phai-email", "123", "abc")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_INPUT.getCode()));
    }

    @Test
    @DisplayName("Email đăng ký được chuẩn hoá chữ thường")
    void dangKyChuanHoaEmail() {
        authenticationService.register(registerRequest("  AUTH-NEW@TEST.LOCAL  "));

        assertThat(userRepository.findByEmail(NEW_EMAIL)).isPresent();
        assertThat(userRepository.findByEmail("  AUTH-NEW@TEST.LOCAL  ")).isEmpty();
    }

    @Test
    @DisplayName("Token mất hiệu lực ngay khi tài khoản bị khoá hoặc xoá mềm")
    void tokenBiThuHoiKhiTaiKhoanBiKhoa() throws Exception {
        User user = userRepository.save(user(JWT_EMAIL, 0));
        String authorization = "Bearer " + authenticationService.generateToken(user, false);

        mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, authorization))
                .andExpect(status().isOk());

        user.setStatus(0);
        userRepository.save(user);
        mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, authorization))
                .andExpect(status().isUnauthorized());

        user.setStatus(1);
        user.setIsDelete(1);
        userRepository.save(user);
        mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, authorization))
                .andExpect(status().isUnauthorized());
    }

    private void deleteUser(String email) {
        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            userRepository.delete(existing);
        }
    }

    private RegisterRequest registerRequest(String email) {
        return RegisterRequest.builder()
                .email(email)
                .password("Secret123")
                .firstName("Nguyễn")
                .lastName("Test")
                .phone("0901234567")
                .build();
    }

    private String registerJson(String email, String password, String phone) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("password", password);
        body.put("firstName", "Nguyễn");
        body.put("lastName", "Test");
        body.put("phone", phone);
        return objectMapper.writeValueAsString(body);
    }

    private User user(String email, int isDelete) {
        return User.builder()
                .email(email)
                .password("test-password")
                .firstName("Test")
                .lastName("User")
                .phone("0901234567")
                .status(1)
                .isDelete(isDelete)
                .admin(false)
                .build();
    }
}
