import { useQuery } from "@tanstack/react-query";
import { fetchMyOrderDetail, fetchMyOrderStatusCounts, fetchMyOrders } from "../api/order.api";

// Mọi cache đơn hàng đều bắt đầu bằng "orders" để chỉ cần
// invalidateQueries({ queryKey: ORDERS_KEY }) là làm mới toàn bộ.
export const ORDERS_KEY = ["orders"];
export const MY_ORDERS_KEY = [...ORDERS_KEY, "me"];
export const myOrderKey = (orderId) => [...MY_ORDERS_KEY, "detail", String(orderId)];

// staleTime 1 phút (xem bảng trong lib/queryClient.js): trạng thái đơn đổi khi người bán cập nhật
export function useMyOrders(params) {
  return useQuery({
    queryKey: [...MY_ORDERS_KEY, "list", params],
    queryFn: () => fetchMyOrders(params),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useMyOrderStatusCounts() {
  return useQuery({
    queryKey: [...MY_ORDERS_KEY, "counts"],
    queryFn: fetchMyOrderStatusCounts,
    staleTime: 60 * 1000,
  });
}

export function useMyOrderDetail(orderId) {
  return useQuery({
    queryKey: myOrderKey(orderId),
    queryFn: () => fetchMyOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000,
    retry: false, // 404 (đơn không tồn tại / của người khác) thì thử lại cũng vô ích
  });
}
