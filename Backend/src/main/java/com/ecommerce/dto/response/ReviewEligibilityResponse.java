package com.ecommerce.dto.response;

/**
 * Trạng thái đánh giá của người dùng hiện tại với một sản phẩm.
 *
 * @param canReview   true nếu có thể gửi đánh giá ngay
 * @param orderItemId món hàng hợp lệ để gửi kèm khi canReview = true
 * @param reason      NOT_PURCHASED | ORDER_NOT_COMPLETED | ALREADY_REVIEWED khi không thể đánh giá
 * @param myReview    đánh giá gần nhất của người dùng cho sản phẩm (nếu đã có)
 */
public record ReviewEligibilityResponse(boolean canReview, Integer orderItemId,
                                        String reason, ReviewResponse myReview) {
}
