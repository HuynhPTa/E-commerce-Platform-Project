package com.ecommerce.service;

import com.ecommerce.dto.request.UserStatusRequest;
import com.ecommerce.dto.response.AdminUserResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

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

    @Transactional
    public AdminUserResponse updateStatus(int id, UserStatusRequest request, String currentEmail) {
        User user = userRepository.findById(id)
                .filter(u -> u.getIsDelete() == 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new AppException(ErrorCode.CANNOT_MODIFY_SELF);
        }
        boolean isAdmin = user.isAdmin() || "ADMIN".equalsIgnoreCase(user.getRole());
        if (isAdmin && request.getStatus() == 0) {
            throw new AppException(ErrorCode.CANNOT_LOCK_ADMIN);
        }

        user.setStatus(request.getStatus());
        userRepository.save(user);
        return toResponse(user, shopRepository.findByOwnerId(id).orElse(null));
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
        boolean isAdmin = user.isAdmin() || "ADMIN".equalsIgnoreCase(user.getRole());
        return new AdminUserResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), OrderResponseMapper.fullName(user), user.getPhone(),
                user.getAvatar(), isAdmin ? "ADMIN" : "USER", user.getStatus(), user.getIsDelete(),
                user.getDateOfBirth(),
                shop == null ? null : shop.getId(),
                shop == null ? null : shop.getName(),
                shop == null ? null : shop.getStatus().name());
    }
}
