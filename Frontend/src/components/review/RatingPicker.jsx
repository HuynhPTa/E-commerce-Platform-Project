import { useState } from "react";
import { Star } from "lucide-react";

const LABELS = {
  1: "Rất tệ",
  2: "Không hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Tuyệt vời",
};

// Chọn số sao bằng chuột hoặc bàn phím (mỗi sao là một radio).
export default function RatingPicker({ value = 0, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="rating-picker">
      <div className="rating-picker__stars" role="radiogroup" aria-label="Chọn số sao">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} sao`}
            className={`rating-picker__star${n <= active ? " is-active" : ""}`}
            disabled={disabled}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(n)}
            onBlur={() => setHovered(0)}
          >
            <Star size={28} fill={n <= active ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        ))}
      </div>
      <span className="rating-picker__label">{LABELS[active] ?? "Chọn số sao"}</span>
    </div>
  );
}
