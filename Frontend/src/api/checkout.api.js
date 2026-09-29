import { apiClient } from "./client";

// Trả về nhiều order (tách theo shop) + redirectUrl thanh toán (VNPay/Momo)
export async function submitCheckout(payload) {
  const { data } = await apiClient.post("/checkout", payload);
  return data; // { checkoutSessionId, orders: [...], redirectUrl }
}
