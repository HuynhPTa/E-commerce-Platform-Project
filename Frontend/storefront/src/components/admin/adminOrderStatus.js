// Bảng này khai báo các hành động hợp lệ cho từng trạng thái đơn hàng.
// Luật chuyển trạng thái khớp với backend.
export const CAC_HANH_DONG_DON_HANG = {
  PENDING: [
    {
      status: "CONFIRMED",
      label: "Xác nhận đơn",
      className: "btn btn--primary btn--sm",
    },
    {
      status: "CANCELLED",
      label: "Huỷ đơn",
      className: "btn btn--danger btn--sm",
      confirm: true,
    },
  ],
  CONFIRMED: [
    {
      status: "SHIPPING",
      label: "Bắt đầu giao",
      className: "btn btn--primary btn--sm",
    },
    {
      status: "CANCELLED",
      label: "Huỷ đơn",
      className: "btn btn--danger btn--sm",
      confirm: true,
    },
  ],
  SHIPPING: [
    {
      status: "DELIVERED",
      label: "Đã giao hàng",
      className: "btn btn--primary btn--sm",
    },
  ],
  DELIVERED: [
    {
      status: "COMPLETED",
      label: "Hoàn tất đơn",
      className: "btn btn--primary btn--sm",
    },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

// Mảng này khai báo các tab trạng thái trên trang đơn hàng.
export const CAC_TAB_TRANG_THAI_DON_HANG = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "COMPLETED", label: "Hoàn tất" },
  { key: "CANCELLED", label: "Đã huỷ" },
];

// Mảng này lưu thứ tự trạng thái hiển thị trong bảng thống kê.
export const CAC_TRANG_THAI_THONG_KE = [
  "PENDING",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];
