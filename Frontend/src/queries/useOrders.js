import { useQuery } from "@tanstack/react-query";
import { fetchMyOrderDetail, fetchMyOrders } from "../api/orders.api";

// Cùng prefix với cache mà useCheckout invalidate sau khi đặt hàng.
export const BUYER_ORDERS_KEY = ["orders", "me"];

export const buyerOrderKey = (orderId) =>
  [...BUYER_ORDERS_KEY, "detail", String(orderId)];

export function useMyOrders(params) {
  return useQuery({
    queryKey: [...BUYER_ORDERS_KEY, "list", params],
    queryFn: () => fetchMyOrders(params),
    staleTime: 20 * 1000,
    placeholderData: (prev) => prev, // giữ trang cũ khi đổi tab/phân trang
  });
}

export function useMyOrderDetail(orderId) {
  return useQuery({
    queryKey: buyerOrderKey(orderId),
    queryFn: () => fetchMyOrderDetail(orderId),
    enabled: Number.isInteger(orderId) && orderId > 0,
    staleTime: 15 * 1000,
  });
}
