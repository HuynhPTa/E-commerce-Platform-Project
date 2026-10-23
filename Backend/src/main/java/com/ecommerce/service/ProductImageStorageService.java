package com.ecommerce.service;

import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Lưu ảnh sản phẩm trên đĩa cục bộ và phục vụ qua /uploads/product-images/**.
 * DB chỉ lưu đường dẫn tương đối; tên file sinh bằng UUID nên không sợ trùng / path traversal.
 */
@Service
public class ProductImageStorageService {
    public static final String PUBLIC_PREFIX = "/uploads/product-images/";
    public static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    private static final Map<String, Set<String>> ALLOWED_TYPES = Map.of(
            "image/jpeg", Set.of("jpg", "jpeg"),
            "image/png", Set.of("png"),
            "image/webp", Set.of("webp"),
            "image/gif", Set.of("gif")
    );

    private final Path rootDirectory;

    public ProductImageStorageService(
            @Value("${app.upload.product-images-dir:uploads/product-images}") String directory) {
        this.rootDirectory = Paths.get(directory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootDirectory);
        } catch (IOException ex) {
            throw new IllegalStateException("Không tạo được thư mục lưu ảnh: " + rootDirectory, ex);
        }
    }

    public Path getRootDirectory() {
        return rootDirectory;
    }

    /** Trả về đường dẫn tương đối để lưu DB, vd /uploads/product-images/<uuid>.jpg */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.PRODUCT_IMAGE_TOO_LARGE);
        }
        String extension = resolveExtension(file);
        String filename = UUID.randomUUID() + "." + extension;
        try (InputStream input = file.getInputStream()) {
            Files.copy(input, rootDirectory.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new AppException(ErrorCode.PRODUCT_IMAGE_UPLOAD_FAILED);
        }
        return PUBLIC_PREFIX + filename;
    }

    /** Xoá file ứng với đường dẫn đã lưu; lỗi file không còn cũng bỏ qua. */
    public void delete(String relativeUrl) {
        String filename = filenameOf(relativeUrl);
        if (filename == null) {
            return;
        }
        try {
            Files.deleteIfExists(rootDirectory.resolve(filename));
        } catch (IOException ignored) {
            // Không chặn nghiệp vụ chỉ vì file đã bị xoá/không còn
        }
    }

    private static String filenameOf(String relativeUrl) {
        if (relativeUrl == null || !relativeUrl.startsWith(PUBLIC_PREFIX)) {
            return null;
        }
        String filename = relativeUrl.substring(PUBLIC_PREFIX.length());
        if (filename.isBlank() || filename.contains("/") || filename.contains("\\") || filename.contains("..")) {
            return null;
        }
        return filename;
    }

    private static String resolveExtension(MultipartFile file) {
        String contentType = file.getContentType() == null
                ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        Set<String> allowedExtensions = ALLOWED_TYPES.get(contentType);
        if (allowedExtensions == null) {
            throw new AppException(ErrorCode.PRODUCT_IMAGE_INVALID_TYPE);
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        int dot = original.lastIndexOf('.');
        String extension = dot >= 0 ? original.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
        if (extension.isBlank()) {
            return allowedExtensions.iterator().next();
        }
        if (!allowedExtensions.contains(extension)) {
            throw new AppException(ErrorCode.PRODUCT_IMAGE_INVALID_TYPE);
        }
        return extension;
    }
}
