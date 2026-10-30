import { apiClient } from "./client";

// api/ — chỉ hàm thuần trả Promise, không import react / @tanstack/react-query.
// Đơn hàng của người mua đang đăng nhập (F15).

// params: { status, page, size }
export async function fetchMyOrders(params) {
  const { data } = await apiClient.get("/orders/me", { params });
  return data.result; // PageResponse<OrderSummaryResponse>
}

export async function fetchMyOrderStatusCounts() {
  const { data } = await apiClient.get("/orders/me/status-counts");
  return data.result; // { PENDING: 1, SHIPPING: 2, ... }
}

export async function fetchMyOrderDetail(orderId) {
  const { data } = await apiClient.get(`/orders/me/${orderId}`);
  return data.result; // OrderDetailResponse (có statusHistory cho timeline)
}
