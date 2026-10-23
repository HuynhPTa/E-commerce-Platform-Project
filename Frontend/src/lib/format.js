// Định dạng tiền theo VND. Backend lưu priceMinor theo đơn vị nhỏ nhất nhưng với VND
// không nhân 100 (xem docs/api-seller-products.md) nên hiển thị trực tiếp.
export function formatVnd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${amount.toLocaleString("vi-VN")}₫`;
}
