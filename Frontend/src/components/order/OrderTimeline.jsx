import { Check, Circle, XCircle } from "lucide-react";
import { formatDate } from "../../lib/errors";

// Các mốc chính của đơn hàng, khớp enum OrderStatus ở Backend.
const STEPS = [
  { key: "PENDING", label: "Đặt hàng" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "COMPLETED", label: "Hoàn tất" },
];

export default function OrderTimeline({ status, createdAt, updatedAt }) {
  if (status === "CANCELLED") {
    return (
      <ol className="order-timeline order-timeline--cancelled">
        <li className="order-timeline__step is-cancelled">
          <span className="order-timeline__dot"><XCircle size={15} /></span>
          <div>
            <strong>Đơn hàng đã huỷ</strong>
            <small className="muted">Cập nhật {formatDate(updatedAt)}</small>
          </div>
        </li>
      </ol>
    );
  }

  const current = Math.max(0, STEPS.findIndex((step) => step.key === status));

  return (
    <ol className="order-timeline">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.key}
            className={`order-timeline__step${done ? " is-done" : ""}${active ? " is-active" : ""}`}
            aria-current={active ? "step" : undefined}
          >
            <span className="order-timeline__dot">
              {done ? <Check size={14} /> : <Circle size={14} />}
            </span>
            <div>
              <strong>{step.label}</strong>
              {index === 0 && <small className="muted">Đặt lúc {formatDate(createdAt)}</small>}
              {active && index > 0 && (
                <small className="muted">Cập nhật {formatDate(updatedAt)}</small>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
