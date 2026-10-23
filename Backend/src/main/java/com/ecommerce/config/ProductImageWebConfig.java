package com.ecommerce.config;

import com.ecommerce.service.ProductImageStorageService;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.MultipartConfigElement;

/**
 * Cấu hình riêng cho ảnh sản phẩm (tránh sửa WebConfig dùng chung):
 * - giới hạn dung lượng multipart
 * - phục vụ file đã upload qua /uploads/product-images/**
 */
@Configuration
public class ProductImageWebConfig implements WebMvcConfigurer {

    private final ProductImageStorageService storageService;

    public ProductImageWebConfig(ProductImageStorageService storageService) {
        this.storageService = storageService;
    }

    @Bean
    public MultipartConfigElement productImageMultipartConfig() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        // Giới hạn 1 file ảnh 5 MB; request lớn hơn một chút để chứa phần boundary của form
        factory.setMaxFileSize(DataSize.ofMegabytes(5));
        factory.setMaxRequestSize(DataSize.ofMegabytes(6));
        return factory.createMultipartConfig();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = storageService.getRootDirectory().toUri().toString();
        registry.addResourceHandler(ProductImageStorageService.PUBLIC_PREFIX + "**")
                .addResourceLocations(location.endsWith("/") ? location : location + "/");
    }
}
