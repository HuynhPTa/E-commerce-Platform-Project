import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReview,
  fetchProductReviews,
  fetchReviewEligibility,
} from "../api/review.api";
import { hasToken } from "./useMe";

// Key cha dùng để invalidate toàn bộ các trang đánh giá của một sản phẩm.
export const reviewsKey = (productId) => ["reviews", productId];
export const reviewEligibilityKey = (productId) => ["review-eligibility", productId];

export function useProductReviewsQuery(productId, page = 1, size = 5) {
  return useQuery({
    queryKey: [...reviewsKey(productId), page, size],
    queryFn: () => fetchProductReviews(productId, { page, size }),
    enabled: !!productId,
    placeholderData: (previousData) => previousData, // giữ danh sách cũ khi chuyển trang
  });
}

// Chỉ gọi khi đã đăng nhập: endpoint yêu cầu Bearer token.
export function useReviewEligibilityQuery(productId) {
  return useQuery({
    queryKey: reviewEligibilityKey(productId),
    queryFn: () => fetchReviewEligibility(productId),
    enabled: !!productId && hasToken(),
    retry: false,
  });
}

export function useCreateReviewMutation(productId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      // rating_avg/rating_count nằm trong product detail -> bắt buộc làm mới ['product', id]
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: reviewsKey(productId) });
      queryClient.invalidateQueries({ queryKey: reviewEligibilityKey(productId) });
    },
  });
}
