package com.ecommerce.config;

import com.ecommerce.entity.User;
import com.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;

// Bộ giải mã JWT của hệ thống.
// Ngoài kiểm tra chữ ký/hạn dùng, còn kiểm tra tài khoản còn tồn tại và chưa bị khoá,
// nhờ vậy token cũ mất hiệu lực ngay khi admin khoá hoặc xoá mềm người dùng.
@Component
public class CustomJwtDecoder implements JwtDecoder {
    private final NimbusJwtDecoder nimbusJwtDecoder;
    private final UserRepository userRepository;

    public CustomJwtDecoder(@Value("${jwt.signerKey}") String signerKey,
                            UserRepository userRepository) {
        SecretKeySpec keySpec = new SecretKeySpec(signerKey.getBytes(), "HS512");
        this.nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(keySpec)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
        this.userRepository = userRepository;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        Jwt jwt = nimbusJwtDecoder.decode(token);

        String email = jwt.getSubject();
        if (email == null || email.isBlank()) {
            throw new BadJwtException("Token không có chủ thể hợp lệ");
        }

        User user = userRepository.findByEmailAndIsDelete(email, 0).orElse(null);
        if (user == null) {
            throw new BadJwtException("Tài khoản không tồn tại hoặc đã bị xoá");
        }
        if (user.getStatus() == 0) {
            throw new BadJwtException("Tài khoản đã bị khoá");
        }
        return jwt;
    }
}
