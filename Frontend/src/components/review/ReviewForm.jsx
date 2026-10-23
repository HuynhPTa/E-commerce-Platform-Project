import { useState } from "react";
import { Send } from "lucide-react";
import RatingPicker from "./RatingPicker";

const MAX_COMMENT = 2000;

// Form gửi đánh giá; việc gọi API do component cha (ProductReviews) đảm nhận.
export default function ReviewForm({ onSubmit, isPending, serverError }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [validationError, setValidationError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!rating) {
      setValidationError("Vui lòng chọn số sao trước khi gửi.");
      return;
    }
    setValidationError("");
    onSubmit({ rating, comment: comment.trim() || null });
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Chia sẻ cảm nhận của bạn</h3>
      <div className="field">
        <RatingPicker value={rating} onChange={setRating} disabled={isPending} />
        {validationError && <p role="alert">{validationError}</p>}
      </div>
      <div className="field">
        <label htmlFor="review-comment">Nhận xét</label>
        <textarea
          id="review-comment"
          value={comment}
          maxLength={MAX_COMMENT}
          placeholder="Sản phẩm có đúng mô tả không? Chất lượng thế nào?"
          onChange={(event) => setComment(event.target.value)}
          disabled={isPending}
        />
        <div className="hint">{comment.length}/{MAX_COMMENT} ký tự</div>
      </div>
      {serverError && <p role="alert">{serverError}</p>}
      <button type="submit" className="btn btn-primary" disabled={isPending}>
        <Send size={15} /> {isPending ? "Đang gửi…" : "Gửi đánh giá"}
      </button>
    </form>
  );
}
