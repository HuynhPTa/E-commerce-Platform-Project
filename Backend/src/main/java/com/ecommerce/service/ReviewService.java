package com.ecommerce.service;

import com.ecommerce.dto.request.ReviewCreateRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ReviewEligibilityResponse;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.Review;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.util.MediaUrlUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final int MAX_PAGE_SIZE = 50;

    public static final String REASON_NOT_PURCHASED = "NOT_PURCHASED";
    public static final String REASON_ORDER_NOT_COMPLETED = "ORDER_NOT_COMPLETED";
    public static final String REASON_ALREADY_REVIEWED = "ALREADY_REVIEWED";

    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * Tạo đánh giá cho một món hàng đã mua.
     * Điều kiện: món hàng thuộc đơn của chính người dùng, đơn đã COMPLETED,
     * và sản phẩm chưa được đánh giá trong đơn đó.
     */
    @Transactional
    public ReviewResponse create(int userId, ReviewCreateRequest request) {
        OrderItem item = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_ORDER_ITEM_NOT_FOUND));

        Order order = item.getOrder();
        if (order.getBuyer().getId() != userId) {
            throw new AppException(ErrorCode.REVIEW_NOT_ALLOWED);
        }
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new AppException(ErrorCode.REVIEW_ORDER_NOT_COMPLETED);
        }

        ProductVariant variant = productVariantRepository.findById(item.getVariantId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        int productId = variant.getProduct().getId();

        // Kiểm tra sớm để trả lỗi thân thiện; unique constraint ở DB vẫn là chốt chặn cuối
        if (reviewRepository.existsByOrderItemId(item.getId())
                || reviewRepository.existsByOrderIdAndProductId(order.getId(), productId)) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Review review = new Review();
        review.setOrderItemId(item.getId());
        review.setOrderId(order.getId());
        review.setUserId(userId);
        review.setProductId(productId);
        review.setRating(request.getRating());
        review.setComment(normalizeComment(request.getComment()));

        try {
            reviewRepository.saveAndFlush(review);
        } catch (DataIntegrityViolationException ex) {
            // Hai request đồng thời cùng món/sản phẩm: unique constraint thắng
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        recalculateRating(productId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return toResponse(review, user);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> listByProduct(int productId, int page, int size) {
        if (!productRepository.existsById(productId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        Page<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDescIdDesc(
                productId, PageRequest.of(safePage - 1, safeSize));

        Map<Integer, User> users = new HashMap<>();
        if (!reviews.isEmpty()) {
            List<Integer> userIds = reviews.getContent().stream().map(Review::getUserId).distinct().toList();
            userRepository.findAllById(userIds).forEach(user -> users.put(user.getId(), user));
        }

        List<ReviewResponse> items = reviews.getContent().stream()
                .map(review -> toResponse(review, users.get(review.getUserId())))
                .toList();
        return new PageResponse<>(items, safePage, safeSize,
                reviews.getTotalElements(), reviews.getTotalPages());
    }

    /**
     * Cho frontend biết có được đánh giá không, kèm orderItemId hợp lệ để gửi lên.
     */
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse getEligibility(int userId, int productId) {
        if (!productRepository.existsById(productId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Review myReview = reviewRepository
                .findFirstByUserIdAndProductIdOrderByCreatedAtDescIdDesc(userId, productId)
                .orElse(null);
        ReviewResponse myReviewResponse = myReview == null ? null : toResponse(myReview, user);

        List<OrderItem> eligible = orderItemRepository.findEligibleForReview(
                userId, productId, OrderStatus.COMPLETED);
        if (!eligible.isEmpty()) {
            return new ReviewEligibilityResponse(true, eligible.get(0).getId(), null, myReviewResponse);
        }

        long completedItems = orderItemRepository.countCompletedItems(
                userId, productId, OrderStatus.COMPLETED);
        if (completedItems > 0) {
            return new ReviewEligibilityResponse(false, null, REASON_ALREADY_REVIEWED, myReviewResponse);
        }

        long purchasedItems = orderItemRepository.countPurchasedItems(userId, productId);
        String reason = purchasedItems == 0 ? REASON_NOT_PURCHASED : REASON_ORDER_NOT_COMPLETED;
        return new ReviewEligibilityResponse(false, null, reason, myReviewResponse);
    }

    /**
     * Tính lại rating từ bảng reviews thay vì cộng/trừ để luôn đúng sau mọi thay đổi.
     * Khoá product để các review đồng thời không ghi đè kết quả của nhau.
     */
    private void recalculateRating(int productId) {
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        long count = reviewRepository.countByProductId(productId);
        Double average = reviewRepository.averageRatingByProductId(productId);
        product.setRatingCount((int) Math.min(count, Integer.MAX_VALUE));
        product.setRatingAvg(average == null ? 0 : Math.round(average * 10.0) / 10.0);
    }

    private String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String trimmed = comment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ReviewResponse toResponse(Review review, User user) {
        return new ReviewResponse(review.getId(), review.getOrderItemId(), review.getRating(),
                review.getComment(), displayName(user),
                user == null ? null : MediaUrlUtil.toAbsolute(user.getAvatar()),
                review.getCreatedAt());
    }

    private String displayName(User user) {
        if (user == null) {
            return "Người dùng MarketHub";
        }
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String name = (last + " " + first).trim();
        return name.isEmpty() ? "Người dùng MarketHub" : name;
    }
}
