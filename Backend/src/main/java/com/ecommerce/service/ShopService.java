package com.ecommerce.service;

import com.ecommerce.dto.request.ShopRequest;
import com.ecommerce.dto.request.ShopStatusRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ShopResponse;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.ShopStatus;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShopService {
    private static final int MAX_PAGE_SIZE = 50;

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // ---------- Người bán ----------

    // Mỗi tài khoản chỉ có 1 shop. Shop bị từ chối thì được sửa và gửi lại (quay về PENDING).
    @Transactional
    public ShopResponse register(String email, ShopRequest req) {
        // khoá dòng user: 2 request đăng ký song song của cùng người sẽ chạy lần lượt
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Shop shop = shopRepository.findByOwnerId(user.getId()).orElse(null);

        if (shop != null && shop.getStatus() != ShopStatus.REJECTED) {
            throw new AppException(ErrorCode.SHOP_EXISTED);
        }
        String name = req.getName().trim();
        boolean nameTaken = shop == null ? shopRepository.existsByNameIgnoreCase(name)
                : shopRepository.existsByNameIgnoreCaseAndIdNot(name, shop.getId());
        if (nameTaken) throw new AppException(ErrorCode.SHOP_NAME_EXISTED);

        if (shop == null) shop = Shop.builder().owner(user).build();
        shop.setName(name);
        shop.setDescription(blankToNull(req.getDescription()));
        shop.setLogoUrl(blankToNull(req.getLogoUrl()));
        shop.setPhone(req.getPhone().trim());
        shop.setPickupAddress(req.getPickupAddress().trim());
        shop.setStatus(ShopStatus.PENDING);
        shop.setStatusNote(null);
        shop.setReviewedAt(null);
        return toResponse(shopRepository.save(shop), true);
    }

    @Transactional(readOnly = true)
    public ShopResponse myShop(String email) {
        User user = userRepository.findByEmailAndIsDelete(email, 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return shopRepository.findByOwnerId(user.getId())
                .map(s -> toResponse(s, true))
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTED));
    }

    // ---------- Công khai ----------

    // Khách chỉ thấy shop đã duyệt; chủ shop và Admin xem được cả shop chưa duyệt (kèm thông tin riêng)
    @Transactional(readOnly = true)
    public ShopResponse getById(Integer id, Jwt jwt) {
        Shop shop = shopRepository.findWithOwnerById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTED));
        boolean privileged = jwt != null && (isAdmin(jwt) || shop.getOwner().getEmail().equals(jwt.getSubject()));
        if (shop.getStatus() != ShopStatus.APPROVED && !privileged) {
            throw new AppException(ErrorCode.SHOP_NOT_EXISTED);
        }
        return toResponse(shop, privileged);
    }

    // ---------- Admin ----------

    @Transactional(readOnly = true)
    public PageResponse<ShopResponse> adminSearch(ShopStatus status, String q, int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        String term = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        Page<Shop> result = shopRepository.search(status, term,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PageResponse<>(result.getContent().stream().map(s -> toResponse(s, true)).toList(),
                safePage, safeSize, result.getTotalElements(), result.getTotalPages());
    }

    // Số shop theo từng trạng thái, cho các tab trên trang duyệt shop
    @Transactional(readOnly = true)
    public Map<String, Long> summary() {
        Map<String, Long> out = new LinkedHashMap<>();
        long total = 0;
        for (ShopStatus s : ShopStatus.values()) out.put(s.name(), 0L);
        for (Object[] row : shopRepository.countByStatus()) {
            out.put(((ShopStatus) row[0]).name(), (Long) row[1]);
            total += (Long) row[1];
        }
        out.put("ALL", total);
        return out;
    }

    @Transactional
    public ShopResponse updateStatus(Integer id, ShopStatusRequest req) {
        Shop shop = shopRepository.findWithOwnerById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTED));
        ShopStatus next = req.getStatus();
        if (!shop.getStatus().canMoveTo(next)) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        boolean needsReason = next == ShopStatus.REJECTED || next == ShopStatus.SUSPENDED;
        if (needsReason && (req.getNote() == null || req.getNote().isBlank())) {
            throw new AppException(ErrorCode.INVALID_INPUT);   // từ chối / khoá phải ghi lý do
        }
        shop.setStatus(next);
        shop.setStatusNote(needsReason ? req.getNote().trim() : null);
        shop.setReviewedAt(LocalDateTime.now());
        return toResponse(shopRepository.save(shop), true);
    }

    // ---------- Hỗ trợ ----------

    private static boolean isAdmin(Jwt jwt) {
        String scope = jwt.getClaimAsString("scope");
        return scope != null && scope.contains("ADMIN");
    }

    private ShopResponse toResponse(Shop s, boolean withPrivate) {
        User o = s.getOwner();
        String ownerName = ((o.getFirstName() == null ? "" : o.getFirstName()) + " "
                + (o.getLastName() == null ? "" : o.getLastName())).trim();
        long productCount = productRepository.countByShopIdAndStatusIgnoreCase(String.valueOf(s.getId()), "ACTIVE");
        return new ShopResponse(s.getId(), s.getName(), s.getDescription(), s.getLogoUrl(), s.getStatus().name(),
                withPrivate ? s.getStatusNote() : null,
                withPrivate ? s.getPhone() : null,
                withPrivate ? s.getPickupAddress() : null,
                o.getId(), ownerName,
                withPrivate ? o.getEmail() : null,
                productCount, s.getCreatedAt(), s.getReviewedAt());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
