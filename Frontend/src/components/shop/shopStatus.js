import { Clock, CircleCheck, Ban, Lock } from "lucide-react";

export const SHOP_STATUS = {
  PENDING: { label: "Chờ duyệt", className: "badge-warning", Icon: Clock },
  APPROVED: { label: "Đang hoạt động", className: "badge-success", Icon: CircleCheck },
  REJECTED: { label: "Bị từ chối", className: "badge-danger", Icon: Ban },
  SUSPENDED: { label: "Đã khoá", className: "badge-muted", Icon: Lock },
};
