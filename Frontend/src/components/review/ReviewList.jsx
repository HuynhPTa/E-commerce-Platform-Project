import { useState } from "react";
import { LoaderCircle, MessageSquareText } from "lucide-react";
import ReviewStars from "./ReviewStars";
import { formatDate } from "../../lib/errors";

function initials(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

// Avatar có fallback chữ cái đầu khi URL ảnh lỗi/không tồn tại.
function ReviewAvatar({ src, name }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="review-avatar" aria-hidden="true">{initials(name)}</span>;
  }
  return (
    <img
      className="review-avatar"
      src={src}
      alt={name}
      onError={() => setFailed(true)}
    />
  );
}

// Danh sách đánh giá chỉ nhận data qua props, không tự gọi API.
export default function ReviewList({ reviews = [], isLoading, isError }) {
  if (isLoading) {
    return (
      <div className="center-box">
        <LoaderCircle className="spin" /> Đang tải đánh giá…
      </div>
    );
  }

  if (isError) return <p role="alert">Không tải được đánh giá. Vui lòng thử lại sau.</p>;

  if (reviews.length === 0) {
    return (
      <div className="review-empty">
        <MessageSquareText size={30} />
        <p>Chưa có đánh giá nào cho sản phẩm này.</p>
      </div>
    );
  }

  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <li key={review.id} className="review-item">
          <ReviewAvatar src={review.userAvatar} name={review.userName} />
          <div className="review-body">
            <div className="review-head">
              <strong>{review.userName || "Người dùng MarketHub"}</strong>
              <span className="cell-sub">{formatDate(review.createdAt)}</span>
            </div>
            <ReviewStars rating={review.rating} size={13} />
            {review.comment && <p className="review-comment">{review.comment}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
