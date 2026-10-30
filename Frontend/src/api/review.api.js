import { apiClient } from "./client";

// Danh sách đánh giá công khai của một sản phẩm (phân trang).
export async function fetchProductReviews(productId, { page = 1, size = 5 } = {}) {
  const { data } = await apiClient.get(`/products/${productId}/reviews`, {
    params: { page, size },
  });
  return data.result ?? data; // PageResponse<ReviewResponse>
}

// Trạng thái đánh giá của người dùng hiện tại: canReview + orderItemId + lý do.
export async function fetchReviewEligibility(productId) {
  const { data } = await apiClient.get(`/products/${productId}/review-eligibility`);
  return data.result ?? data; // ReviewEligibilityResponse
}

export async function createReview(payload) {
  const { data } = await apiClient.post("/reviews", payload);
  return data.result ?? data; // ReviewResponse
}
