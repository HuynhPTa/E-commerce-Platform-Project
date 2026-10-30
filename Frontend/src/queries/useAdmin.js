import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminDashboard,
  fetchAdminOrders,
  fetchAdminOrderDetail,
  fetchAdminUsers,
  updateAdminUserStatus,
} from "../api/admin.api";

export const ADMIN_DASHBOARD_KEY = ["admin", "dashboard"];
export const ADMIN_ORDERS_KEY = ["admin", "orders"];
export const ADMIN_USERS_KEY = ["admin", "users"];

export const adminOrderKey = (orderId) => [...ADMIN_ORDERS_KEY, "detail", String(orderId)];

export function useAdminDashboard() {
  return useQuery({
    queryKey: ADMIN_DASHBOARD_KEY,
    queryFn: fetchAdminDashboard,
    staleTime: 30 * 1000,
  });
}

export function useAdminOrders(params) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, "list", params],
    queryFn: () => fetchAdminOrders(params),
    staleTime: 20 * 1000,
    placeholderData: (prev) => prev, // giữ bảng cũ khi đổi tab/trang
  });
}

export function useAdminOrderDetail(orderId) {
  return useQuery({
    queryKey: adminOrderKey(orderId),
    queryFn: () => fetchAdminOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 15 * 1000,
  });
}

export function useAdminUsers(params) {
  return useQuery({
    queryKey: [...ADMIN_USERS_KEY, "list", params],
    queryFn: () => fetchAdminUsers(params),
    staleTime: 20 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_KEY });
    },
  });
}
