import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSellerDashboard,
  fetchSellerOrders,
  fetchSellerOrderDetail,
  updateSellerOrderStatus,
} from "../api/seller.api";

export const SELLER_DASHBOARD_KEY = ["seller", "dashboard"];
export const SELLER_ORDERS_KEY = ["seller", "orders"];

export const sellerOrderKey = (orderId) => [...SELLER_ORDERS_KEY, "detail", String(orderId)];

export function useSellerDashboard() {
  return useQuery({
    queryKey: SELLER_DASHBOARD_KEY,
    queryFn: fetchSellerDashboard,
    staleTime: 30 * 1000,
  });
}

export function useSellerOrders(params) {
  return useQuery({
    queryKey: [...SELLER_ORDERS_KEY, "list", params],
    queryFn: () => fetchSellerOrders(params),
    staleTime: 20 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useSellerOrderDetail(orderId) {
  return useQuery({
    queryKey: sellerOrderKey(orderId),
    queryFn: () => fetchSellerOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 15 * 1000,
  });
}

export function useUpdateSellerOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSellerOrderStatus,
    onSuccess: (order) => {
      // Server trả chi tiết mới -> ghi thẳng vào cache để modal đổi trạng thái ngay
      queryClient.setQueryData(sellerOrderKey(order.id), order);
      queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: SELLER_DASHBOARD_KEY });
      // COMPLETED làm tăng sold_count; CANCELLED làm tăng tồn kho
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
