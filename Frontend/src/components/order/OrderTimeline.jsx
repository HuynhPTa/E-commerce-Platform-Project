import { Check, ClipboardCheck, PackageCheck, ReceiptText, Truck, Ban, House } from "lucide-react";

// Các bước của một đơn bình thường, khớp luồng OrderStatus ở Backend
const STEPS = [
  { status: "PENDING", label: "Đặt hàng thành công", icon: ReceiptText },
  { status: "CONFIRMED", label: "Người bán đã xác nhận", icon: ClipboardCheck },
  { status: "SHIPPING", label: "Đang giao hàng", icon: Truck },
  { status: "DELIVERED", label: "Đã giao hàng", icon: House },
  { status: "COMPLETED", label: "Hoàn tất", icon: PackageCheck },
];

const formatDateTime = (iso) => (iso
  ? new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
  })
  : null);

// Component chỉ nhận dữ liệu qua props: status hiện tại + statusHistory từ API chi tiết đơn
export default function OrderTimeline({ status, history = [] }) {
  const timeOf = {};
  for (const event of history) timeOf[event.status] = event.changedAt;

  const cancelled = status === "CANCELLED";
  // Đơn bị huỷ: chỉ hiện các bước đã đi qua, sau đó là bước "Đã huỷ"
  const reached = cancelled
    ? STEPS.filter((step) => timeOf[step.status]).length - 1
    : STEPS.findIndex((step) => step.status === status);
  const steps = cancelled
    ? [...STEPS.slice(0, Math.max(reached, 0) + 1), { status: "CANCELLED", label: "Đơn đã bị huỷ", icon: Ban }]
    : STEPS;
  const current = cancelled ? steps.length - 1 : reached;

  return (
    <ol className={`order-timeline${cancelled ? " is-cancelled" : ""}`}>
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";
        const Icon = state === "done" ? Check : step.icon;
        const time = formatDateTime(timeOf[step.status]);
        return (
          <li key={step.status} className={`order-timeline__step is-${state}`}>
            <span className="order-timeline__dot"><Icon size={16} /></span>
            <div>
              <div className="order-timeline__label">{step.label}</div>
              <div className="order-timeline__time">
                {time ?? (state === "todo" ? "Chưa tới bước này" : "—")}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
