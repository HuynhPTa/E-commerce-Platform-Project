import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminProducts, fetchAdminProduct,
  createAdminProduct, updateAdminProduct, deleteAdminProduct,
  createAdminProductVariant, updateAdminProductVariant, deleteAdminProductVariant,
  uploadAdminProductImage, deleteAdminProductImage,
} from "../api/admin-product.api";
import { ADMIN_DASHBOARD_KEY } from "./useAdmin";

export const ADMIN_PRODUCTS_KEY = ["admin", "products"];
export const adminProductKey = (productId) => ["admin", "product", String(productId)];

// Sau mọi mutation phải làm mới danh sách admin, chi tiết admin, catalog công khai
// và số liệu dashboard vì cùng một sản phẩm xuất hiện ở nhiều khu vực.
function invalidateProductQueries(queryClient, productId) {
  const tasks = [
    queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY }),
    queryClient.invalidateQueries({ queryKey: ["products"] }),
    queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_KEY }),
  ];
  if (productId != null) {
    tasks.push(queryClient.invalidateQueries({ queryKey: adminProductKey(productId) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: ["product", String(productId)] }));
  }
  return Promise.all(tasks);
}

// params: { q, status, page, size }
export function useAdminProducts(params) {
  return useQuery({
    queryKey: [...ADMIN_PRODUCTS_KEY, params],
    queryFn: () => fetchAdminProducts(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminProduct(productId) {
  return useQuery({
    queryKey: adminProductKey(productId),
    queryFn: () => fetchAdminProduct(productId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminProduct,
    onSuccess: (product) => invalidateProductQueries(queryClient, product?.id),
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminProduct,
    onSuccess: (_product, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: (_result, productId) => invalidateProductQueries(queryClient, productId),
  });
}

export function useCreateAdminProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminProductVariant,
    onSuccess: (_variant, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

export function useUpdateAdminProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminProductVariant,
    onSuccess: (_variant, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

export function useDeleteAdminProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminProductVariant,
    onSuccess: (_result, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

// Upload: KHÔNG optimistic update — ảnh chỉ hiện khi server đã lưu xong.
export function useUploadAdminProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadAdminProductImage,
    onSuccess: (_image, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

export function useDeleteAdminProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminProductImage,
    onSuccess: (_result, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}
