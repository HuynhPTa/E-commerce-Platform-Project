import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import {
  useCreateReviewMutation,
  useProductReviewsQuery,
  useReviewEligibilityQuery,
} from "../../queries/useReviews";
import { hasToken } from "../../queries/useMe";
import { errMsg } from "../../lib/errors";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import ReviewStars from "./ReviewStars";

const PAGE_SIZE = 5;

// Khối đánh giá ở trang chi tiết sản phẩm:
// tổng quan điểm, form (nếu đủ điều kiện), danh sách + phân trang.
export default function ProductReviews({ productId, ratingAvg = 0, ratingCount = 0 }) {
  const loggedIn = hasToken();
  const [page, setPage] = useState(1);
  const [justReviewed, setJustReviewed] = useState(false);

  const reviewsQuery = useProductReviewsQuery(productId, page, PAGE_SIZE);
  const eligibilityQuery = useReviewEligibilityQuery(productId);
  const createReview = useCreateReviewMutation(productId);

  const eligibility = eligibilityQuery.data;
  const showForm = loggedIn && eligibility?.canReview && !justReviewed;
  const totalPages = reviewsQuery.data?.totalPages ?? 0;

  function handleSubmit(payload) {
    createReview.mutate(
      { orderItemId: eligibility.orderItemId, ...payload },
      {
        onSuccess: () => {
          setJustReviewed(true);
          setPage(1); // đánh giá mới nhất nằm ở trang đầu
        },
      }
    );
  }

  return (
    <section className="product-reviews">
      <div className="review-summary">
        <div className="review-summary__score">
          <strong>{Number(ratingAvg || 0).toFixed(1)}</strong>
          <div>
            <ReviewStars rating={ratingAvg} size={16} />
            <span className="cell-sub">{ratingCount} đánh giá</span>
          </div>
        </div>
        <h2>Đánh giá sản phẩm</h2>
      </div>

      {!loggedIn && (
        <p className="review-cta">
          Đã mua sản phẩm này? <Link to="/login">Đăng nhập</Link> để chia sẻ cảm nhận của bạn.
        </p>
      )}

      {loggedIn && eligibilityQuery.isLoading && (
        <p className="muted row"><LoaderCircle size={14} className="spin" /> Đang kiểm tra quyền đánh giá…</p>
      )}

      {loggedIn && eligibilityQuery.isError && (
        <p className="muted">Chưa thể kiểm tra quyền đánh giá. Vui lòng thử lại sau.</p>
      )}

      {showForm && (
        <ReviewForm
          onSubmit={handleSubmit}
          isPending={createReview.isPending}
          serverError={createReview.isError ? errMsg(createReview.error) : ""}
        />
      )}

      {justReviewed && (
        <div className="alert alert-success">
          <span>Cảm ơn bạn! Đánh giá đã được ghi nhận.</span>
        </div>
      )}

      {!justReviewed && eligibility?.reason === "ALREADY_REVIEWED" && (
        <p className="muted">Bạn đã đánh giá sản phẩm này.</p>
      )}
      {eligibility?.reason === "ORDER_NOT_COMPLETED" && (
        <p className="muted">Đơn hàng của bạn chưa hoàn tất. Bạn có thể đánh giá sau khi đơn được giao thành công.</p>
      )}
      {eligibility?.reason === "NOT_PURCHASED" && (
        <p className="muted">Bạn cần mua sản phẩm này để có thể đánh giá.</p>
      )}

      <ReviewList
        reviews={reviewsQuery.data?.items ?? []}
        isLoading={reviewsQuery.isLoading}
        isError={reviewsQuery.isError}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trước
          </button>
          <span className="cell-sub">Trang {page}/{totalPages}</span>
          <button
            className="btn btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Sau
          </button>
        </div>
      )}
    </section>
  );
}
