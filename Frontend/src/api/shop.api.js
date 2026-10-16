import { apiClient } from "./client";

// ---- Người bán ----
export async function registerShop(payload) {
  const { data } = await apiClient.post("/shops", payload);
  return data.result;
}

// Trả null khi người dùng chưa có shop (BE trả 404) thay vì ném lỗi,
// để UI phân biệt "chưa đăng ký" với "lỗi mạng".
export async function fetchMyShop() {
  try {
    const { data } = await apiClient.get("/shops/me");
    return data.result;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

// ---- Công khai ----
export async function fetchShop(shopId) {
  const { data } = await apiClient.get(`/shops/${shopId}`);
  return data.result;
}

// ---- Admin ----
// params: { status, q, page, size }
export async function fetchAdminShops(params) {
  const { data } = await apiClient.get("/admin/shops", { params });
  return data.result; // PageResponse<ShopResponse>
}

export async function fetchAdminShopSummary() {
  const { data } = await apiClient.get("/admin/shops/summary");
  return data.result; // { PENDING, APPROVED, REJECTED, SUSPENDED, ALL }
}

export async function updateShopStatus({ id, status, note }) {
  const { data } = await apiClient.patch(`/admin/shops/${id}/status`, { status, note });
  return data.result;
}
