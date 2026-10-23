import { apiClient } from "./client";

// api/ — chỉ hàm thuần trả Promise, không import react / @tanstack/react-query.

export async function fetchAdminDashboard() {
  const { data } = await apiClient.get("/admin/dashboard");
  return data.result; // AdminDashboardResponse
}

// params: { status, q, page, size }
export async function fetchAdminOrders(params) {
  const { data } = await apiClient.get("/admin/orders", { params });
  return data.result; // PageResponse<OrderSummaryResponse>
}

export async function fetchAdminOrderDetail(orderId) {
  const { data } = await apiClient.get(`/admin/orders/${orderId}`);
  return data.result; // OrderDetailResponse
}

// params: { role, status, q, page, size }
export async function fetchAdminUsers(params) {
  const { data } = await apiClient.get("/admin/users", { params });
  return data.result; // PageResponse<AdminUserResponse>
}

// status: 1 = mở khoá, 0 = khoá
export async function updateAdminUserStatus({ id, status }) {
  const { data } = await apiClient.patch(`/admin/users/${id}/status`, { status });
  return data.result;
}
