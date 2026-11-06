package com.ecommerce.service;

import com.ecommerce.dto.request.AdminUserRequest;
import com.ecommerce.dto.request.UserStatusRequest;
import com.ecommerce.dto.response.AdminUserDetailResponse;
import com.ecommerce.dto.response.AdminUserResponse;
import com.ecommerce.dto.response.AdminUserStatsResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private static final int MAX_PAGE_SIZE = 50;
    private static final int MIN_PASSWORD_LENGTH = 6;

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> list(String role, Integer status, String q, int page, int size) {
        String normalizedRole = normalizeRole(role);
        if (status != null && status != 0 && status != 1) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        String term = q == null || q.isBlank() ? null
                : "%" + q.trim().toLowerCase(Locale.ROOT) + "%";

        Page<User> result = userRepository.adminSearch(normalizedRole, status, term,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "id")));

        List<Integer> userIds = result.getContent().stream().map(User::getId).toList();
        Map<Integer, Shop> shopsByOwner = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (Shop shop : shopRepository.findByOwnerIdIn(userIds)) {
                shopsByOwner.put(shop.getOwner().getId(), shop);
            }
        }

        List<AdminUserResponse> items = result.getContent().stream()
                .map(user -> toResponse(user, shopsByOwner.get(user.getId())))
                .toList();
        return new PageResponse<>(items, safePage, safeSize,
                result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public AdminUserStatsResponse stats() {
        long totalUsers = userRepository.countByIsDelete(0);
        long activeUsers = userRepository.countByIsDeleteAndStatus(0, 1);
        long adminUsers = userRepository.countAdminUsers();
        long lockedUsers = totalUsers - activeUsers;
        long buyerUsers = totalUsers - adminUsers;
        return new AdminUserStatsResponse(totalUsers, activeUsers, lockedUsers, adminUsers, buyerUsers);
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse detail(int id) {
        User user = getActiveUser(id);
        Shop shop = shopRepository.findByOwnerId(id).orElse(null);
        long orderCount = orderRepository.countByBuyerId(id);
        long completedOrderCount = orderRepository.countByBuyerIdAndStatus(id, OrderStatus.COMPLETED);
        long cancelledOrderCount = orderRepository.countByBuyerIdAndStatus(id, OrderStatus.CANCELLED);
        long totalSpentMinor = orderRepository.sumRevenueByBuyerIdAndStatus(id, OrderStatus.COMPLETED);

        return new AdminUserDetailResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), OrderResponseMapper.fullName(user), user.getPhone(),
                user.getAvatar(), roleOf(user), user.getStatus(), user.getIsDelete(),
                user.getDateOfBirth(),
                shop == null ? null : shop.getId(),
                shop == null ? null : shop.getName(),
                shop == null ? null : shop.getStatus().name(),
                orderCount, completedOrderCount, cancelledOrderCount, totalSpentMinor);
    }

    @Transactional
    public AdminUserResponse create(AdminUserRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(email).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        String password = request.getPassword();
        validatePassword(password, true);

        String role = normalizeRoleOrDefault(request.getRole(), "USER");
        int status = normalizeStatus(request.getStatus(), 1);

        // Tài khoản quản trị không được tạo ở trạng thái khoá, giống quy tắc cập nhật.
        if ("ADMIN".equals(role) && status == 0) {
            throw new AppException(ErrorCode.CANNOT_LOCK_ADMIN);
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(normalizePhone(request.getPhone()))
                .dateOfBirth(request.getDateOfBirth())
                .status(status)
                .isDelete(0)
                .role(role)
                .admin("ADMIN".equals(role))
                .build();
        userRepository.save(user);
        return toResponse(user, null);
    }

    @Transactional
    public AdminUserResponse update(int id, AdminUserRequest request, String currentEmail) {
        User user = getActiveUser(id);
        ensureNotSelf(user, currentEmail);

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (email.equalsIgnoreCase(user.getEmail()) == false) {
            if (userRepository.findByEmail(email).isPresent()) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            }
        }

        String role = normalizeRoleOrDefault(request.getRole(), roleOf(user));
        int status = normalizeStatus(request.getStatus(), user.getStatus());
        boolean wasAdmin = isAdmin(user);
        boolean willBeAdmin = "ADMIN".equals(role);

        if (wasAdmin && willBeAdmin == false) {
            if (userRepository.countAdminUsers() <= 1) {
                throw new AppException(ErrorCode.CANNOT_DEMOTE_LAST_ADMIN);
            }
        }
        if (willBeAdmin && status == 0) {
            throw new AppException(ErrorCode.CANNOT_LOCK_ADMIN);
        }

        // Mật khẩu để trống nghĩa là giữ nguyên mật khẩu hiện tại.
        String password = request.getPassword();
        if (password != null && password.isBlank() == false) {
            validatePassword(password, false);
            user.setPassword(passwordEncoder.encode(password));
        }

        user.setEmail(email);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(normalizePhone(request.getPhone()));
        user.setDateOfBirth(request.getDateOfBirth());
        user.setRole(role);
        user.setAdmin(willBeAdmin);
        user.setStatus(status);
        userRepository.save(user);
        return toResponse(user, shopRepository.findByOwnerId(id).orElse(null));
    }

    @Transactional
    public void delete(int id, String currentEmail) {
        User user = getActiveUser(id);
        ensureNotSelf(user, currentEmail);
        if (isAdmin(user)) {
            throw new AppException(ErrorCode.CANNOT_DELETE_ADMIN);
        }
        user.setIsDelete(1);
        user.setStatus(0);
        userRepository.save(user);
    }

    @Transactional
    public AdminUserResponse updateStatus(int id, UserStatusRequest request, String currentEmail) {
        User user = getActiveUser(id);
        ensureNotSelf(user, currentEmail);
        if (isAdmin(user) && request.getStatus() == 0) {
            throw new AppException(ErrorCode.CANNOT_LOCK_ADMIN);
        }

        user.setStatus(request.getStatus());
        userRepository.save(user);
        return toResponse(user, shopRepository.findByOwnerId(id).orElse(null));
    }

    private User getActiveUser(int id) {
        return userRepository.findById(id)
                .filter(u -> u.getIsDelete() == 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private static void ensureNotSelf(User user, String currentEmail) {
        if (currentEmail != null && user.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new AppException(ErrorCode.CANNOT_MODIFY_SELF);
        }
    }

    private static void validatePassword(String password, boolean required) {
        if (password == null || password.isBlank()) {
            if (required) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
    }

    private static String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String trimmed = phone.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed;
    }

    private static int normalizeStatus(Integer status, int fallback) {
        if (status == null) {
            return fallback;
        }
        if (status != 0 && status != 1) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        return status;
    }

    private static String normalizeRoleOrDefault(String role, String fallback) {
        if (role == null || role.isBlank()) {
            return fallback;
        }
        return normalizeRole(role);
    }

    private static boolean isAdmin(User user) {
        return user.isAdmin() || "ADMIN".equalsIgnoreCase(user.getRole());
    }

    private static String roleOf(User user) {
        if (isAdmin(user)) {
            return "ADMIN";
        }
        return "USER";
    }

    private static String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (!"ADMIN".equals(normalized) && !"USER".equals(normalized)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        return normalized;
    }

    private static AdminUserResponse toResponse(User user, Shop shop) {
        return new AdminUserResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), OrderResponseMapper.fullName(user), user.getPhone(),
                user.getAvatar(), roleOf(user), user.getStatus(), user.getIsDelete(),
                user.getDateOfBirth(),
                shop == null ? null : shop.getId(),
                shop == null ? null : shop.getName(),
                shop == null ? null : shop.getStatus().name());
    }
}
