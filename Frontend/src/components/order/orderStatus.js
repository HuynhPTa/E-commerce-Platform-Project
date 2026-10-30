// Nhãn + màu badge dùng chung cho đơn hàng ở Admin và Kênh người bán.
// Khớp enum OrderStatus ở Backend.
export const ORDER_STATUS = {
  PENDING: { label: "Chờ xác nhận", tone: "warning" },
  CONFIRMED: { label: "Đã xác nhận", tone: "info" },
  SHIPPING: { label: "Đang giao", tone: "info" },
  DELIVERED: { label: "Đã giao", tone: "success" },
  COMPLETED: { label: "Hoàn tất", tone: "success" },
  CANCELLED: { label: "Đã huỷ", tone: "danger" },
};

export const ORDER_STATUS_TABS = [
  { key: "ALL", label: "Tất cả" },
  ...Object.entries(ORDER_STATUS).map(([key, value]) => ({ key, label: value.label })),
];

// Thứ tự hiển thị trong bảng thống kê
export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUS);

export function orderStatusMeta(status) {
  return ORDER_STATUS[status] ?? { label: status || "—", tone: "muted" };
}

// Hành động hợp lệ của người bán (khớp OrderStatus.canSellerMoveTo ở Backend)
export const SELLER_ORDER_ACTIONS = {
  PENDING: [
    { status: "CONFIRMED", label: "Xác nhận đơn", className: "btn-primary" },
    { status: "CANCELLED", label: "Huỷ đơn", className: "btn-danger", confirm: true },
  ],
  CONFIRMED: [
    { status: "SHIPPING", label: "Bắt đầu giao", className: "btn-primary" },
    { status: "CANCELLED", label: "Huỷ đơn", className: "btn-danger", confirm: true },
  ],
  SHIPPING: [
    { status: "DELIVERED", label: "Đã giao hàng", className: "btn-success" },
  ],
  DELIVERED: [
    { status: "COMPLETED", label: "Hoàn tất đơn", className: "btn-success" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export const PAYMENT_METHOD_LABELS = {
  VNPAY: "VNPay",
  MOMO: "MoMo",
};
