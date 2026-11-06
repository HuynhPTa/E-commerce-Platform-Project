import { apiClient } from "./client";

// api/ — chỉ hàm thuần trả Promise, không import react / @tanstack/react-query.

// params: { status, page, size }
export async function fetchMyOrders(params) {
  const { data } = await apiClient.get("/orders", { params });
  return data.result; // PageResponse<OrderSummaryResponse>
}

export async function fetchMyOrderDetail(orderId) {
  const { data } = await apiClient.get(`/orders/${orderId}`);
  return data.result; // OrderDetailResponse
}
