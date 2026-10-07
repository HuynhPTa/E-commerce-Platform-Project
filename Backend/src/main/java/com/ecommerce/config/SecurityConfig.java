package com.ecommerce.config;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.service.CustomOAuth2FailureHandler;
import com.ecommerce.service.CustomOAuth2SuccessHandler;
import com.ecommerce.service.CustomOAuth2UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Autowired
    CustomOAuth2UserService customOAuth2UserService;
    @Autowired
    CustomOAuth2FailureHandler customOAuth2FailureHandler;
    @Autowired
    CustomOAuth2SuccessHandler customOAuth2SuccessHandler;
    @Autowired
    CustomJwtDecoder customJwtDecoder;

    // FIX: mọi pattern phải bắt đầu bằng "/" (Spring 6 sẽ ném lỗi nếu thiếu)
    // FIX: thêm /api/auth/register cho khớp với AuthenticationController
    private final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/register", "/api/auth/login", "/api/auth/introspect",
            "/api/auth/refresh", "/api/auth/login/google",
            "/api/payment/vn-pay-callback",
            "/ws/info"
            // Các endpoint /api/hotels/**, /api/images/** trong bản cũ có vẻ là code
            // sót từ project hotel-booking, thêm lại (có dấu "/" đầu) nếu thật sự cần.
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(request -> request
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers("/", "/login", "/oauth2/**").permitAll()
                        .requestMatchers("/ws/**", "/topic/**", "/app/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService))
                        .failureHandler(customOAuth2FailureHandler)
                        .successHandler(customOAuth2SuccessHandler))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                writeError(response, ErrorCode.UNAUTHENTICATED, 401))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeError(response, ErrorCode.UNAUTHORIZED, 403)));

        httpSecurity.oauth2ResourceServer(
                oauth2 -> oauth2.jwt(jwtConfigurer -> jwtConfigurer.decoder(customJwtDecoder)
                        .jwtAuthenticationConverter(jwtAuthenticationConverter())));
        httpSecurity.csrf(AbstractHttpConfigurer::disable);
        return httpSecurity.build();
    }

    private void writeError(jakarta.servlet.http.HttpServletResponse response, ErrorCode errorCode, int status)
            throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        ApiResponse<Object> apiResponse = new ApiResponse<>(errorCode.getCode(), errorCode.getMessage(), null);
        response.getWriter().write(new ObjectMapper().writeValueAsString(apiResponse));
    }

    // FIX: để static để tránh vòng phụ thuộc:
    // SecurityConfig -> SuccessHandler -> AuthenticationService -> PasswordEncoder (nằm trong SecurityConfig)
    @Bean
    static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost"));
        configuration.setAllowedMethods(List.of("*"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
} // FIX: file gốc thiếu dấu đóng class
