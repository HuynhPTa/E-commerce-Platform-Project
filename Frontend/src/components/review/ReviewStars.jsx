import { Star } from "lucide-react";

// Hiển thị số sao đánh giá (1-5). Dùng chung cho điểm trung bình và từng review.
export default function ReviewStars({ rating = 0, size = 14, showValue = false }) {
  const value = Number(rating) || 0;
  const filled = Math.round(value);

  return (
    <span className="review-stars" aria-label={`${value.toFixed(1)} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= filled ? "is-filled" : undefined}
          fill={n <= filled ? "currentColor" : "none"}
          aria-hidden="true"
        />
      ))}
      {showValue && <span className="review-stars__value">{value.toFixed(1)}</span>}
    </span>
  );
}
