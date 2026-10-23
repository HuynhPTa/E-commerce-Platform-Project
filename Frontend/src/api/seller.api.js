import { apiClient } from "./client";

// api/ — chỉ hàm thuần trả Promise, không import react / @tanstack/react-query.

export async function fetchSellerDashboard() {
  const { data } = await apiClient.get("/seller/dashboard");
  return data.result; // SellerDashboardResponse
}

// params: { status, q, page, size }
export async function fetchSellerOrders(params) {
  const { data } = await apiClient.get("/seller/orders", { params });
  return data.result; // PageResponse<OrderSummaryResponse>
}

export async function fetchSellerOrderDetail(orderId) {
  const { data } = await apiClient.get(`/seller/orders/${orderId}`);
  return data.result; // OrderDetailResponse
}

export async function updateSellerOrderStatus({ orderId, status }) {
  const { data } = await apiClient.patch(`/seller/orders/${orderId}/status`, { status });
  return data.result; // OrderDetailResponse
}
