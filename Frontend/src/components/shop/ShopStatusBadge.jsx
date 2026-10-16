import { Clock } from "lucide-react";
import { SHOP_STATUS } from "./shopStatus";

export default function ShopStatusBadge({ status }) {
  const s = SHOP_STATUS[status] ?? { label: status, className: "badge-muted", Icon: Clock };
  return (
    <span className={`badge ${s.className}`}>
      <s.Icon size={12} /> {s.label}
    </span>
  );
}
