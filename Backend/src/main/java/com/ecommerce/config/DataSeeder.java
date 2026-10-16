package com.ecommerce.config;

import com.ecommerce.entity.Category;
import com.ecommerce.entity.User;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Dữ liệu mẫu khi khởi động: tài khoản Admin + cây danh mục (chỉ tạo khi chưa có)
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@markethub.vn}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        seedCategories();
    }

    private void seedAdmin() {
        User admin = userRepository.findByEmailAndIsDelete(adminEmail, 0).orElse(null);
        if (admin == null) {
            userRepository.save(User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .firstName("Quản trị")
                    .lastName("viên")
                    .avatar("default-avatar.png")
                    .status(1)
                    .isDelete(0)
                    .role("ADMIN")
                    .build());
            log.info("Đã tạo tài khoản Admin mẫu: {}", adminEmail);
        } else if (!"ADMIN".equals(admin.getRole())) {
            admin.setRole("ADMIN");
            userRepository.save(admin);
        }
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;

        // tên danh mục gốc -> [icon lucide, danh mục con...]
        Map<String, List<String>> tree = new LinkedHashMap<>();
        tree.put("Điện thoại & Phụ kiện", List.of("Smartphone", "Điện thoại", "Tai nghe", "Sạc dự phòng", "Ốp lưng"));
        tree.put("Máy tính & Laptop", List.of("Laptop", "Laptop", "Bàn phím", "Chuột", "Màn hình"));
        tree.put("Thời trang nam", List.of("Shirt", "Áo thun", "Quần jean", "Áo khoác"));
        tree.put("Thời trang nữ", List.of("ShoppingBag", "Váy đầm", "Áo kiểu", "Túi xách"));
        tree.put("Giày dép", List.of("Footprints", "Giày thể thao", "Sandal", "Dép"));
        tree.put("Nhà cửa & Đời sống", List.of("Sofa", "Đồ gia dụng", "Trang trí", "Nhà bếp"));
        tree.put("Sắc đẹp", List.of("Sparkles", "Chăm sóc da", "Trang điểm", "Nước hoa"));
        tree.put("Sách & Văn phòng phẩm", List.of("BookOpen", "Sách", "Dụng cụ học tập"));
        tree.put("Thể thao & Du lịch", List.of("Dumbbell", "Dụng cụ thể thao", "Balo du lịch"));

        int order = 0;
        for (var entry : tree.entrySet()) {
            List<String> v = entry.getValue();
            Category root = categoryRepository.save(Category.builder()
                    .name(entry.getKey()).slug(SlugUtil.toSlug(entry.getKey()))
                    .icon(v.get(0)).sortOrder(order++).build());
            for (int i = 1; i < v.size(); i++) {
                String slug = SlugUtil.toSlug(v.get(i));
                if (categoryRepository.existsBySlug(slug)) slug = root.getSlug() + "-" + slug;
                categoryRepository.save(Category.builder()
                        .name(v.get(i)).slug(slug).parent(root).sortOrder(i).build());
            }
        }
        log.info("Đã tạo {} danh mục mẫu", categoryRepository.count());
    }
}
