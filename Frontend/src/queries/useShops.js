import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  registerShop, fetchMyShop, fetchShop,
  fetchAdminShops, fetchAdminShopSummary, updateShopStatus,
} from "../api/shop.api";
import { hasToken } from "./useMe";

export const MY_SHOP_KEY = ["shop", "me"];
export const ADMIN_SHOPS_KEY = ["admin", "shops"];

// Shop của người đang đăng nhập; data = null nghĩa là chưa đăng ký shop
export function useMyShop() {
  return useQuery({
    queryKey: MY_SHOP_KEY,
    queryFn: fetchMyShop,
    staleTime: 60 * 1000,
    enabled: hasToken(),
    retry: false,
  });
}

export function useShop(shopId) {
  return useQuery({
    queryKey: ["shop", String(shopId)],
    queryFn: () => fetchShop(shopId),
    staleTime: 5 * 60 * 1000,
    enabled: !!shopId,
    retry: false,
  });
}

export function useRegisterShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerShop,
    // Server trả về shop mới (status PENDING) -> ghi thẳng vào cache, không cần gọi lại /shops/me
    onSuccess: (shop) => {
      queryClient.setQueryData(MY_SHOP_KEY, shop);
      queryClient.invalidateQueries({ queryKey: ADMIN_SHOPS_KEY });
    },
  });
}

// ---- Admin ----
export function useAdminShops(params) {
  return useQuery({
    queryKey: [...ADMIN_SHOPS_KEY, "list", params],
    queryFn: () => fetchAdminShops(params),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev, // giữ bảng cũ khi đổi tab/trang, tránh nháy
  });
}

export function useAdminShopSummary() {
  return useQuery({
    queryKey: [...ADMIN_SHOPS_KEY, "summary"],
    queryFn: fetchAdminShopSummary,
    staleTime: 30 * 1000,
  });
}

export function useUpdateShopStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShopStatus,
    onSuccess: (shop) => {
      // danh sách + số đếm theo tab đều đổi; trang public của shop cũng phải tải lại
      queryClient.invalidateQueries({ queryKey: ADMIN_SHOPS_KEY });
      queryClient.invalidateQueries({ queryKey: ["shop", String(shop.id)] });
    },
  });
}
