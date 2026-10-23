import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSellerProducts, fetchSellerProduct,
  createSellerProduct, updateSellerProduct, deleteSellerProduct,
  createProductVariant, updateProductVariant, deleteProductVariant,
  uploadProductImage, deleteProductImage,
} from "../api/seller-product.api";
import { MY_SHOP_KEY } from "./useShops";

export const SELLER_PRODUCTS_KEY = ["seller", "products"];
export const sellerProductKey = (productId) => ["seller", "product", String(productId)];

// Sau mọi mutation phải làm mới cả danh sách seller lẫn danh sách/chi tiết phía người mua,
// vì cùng một sản phẩm xuất hiện ở cả 2 khu vực. Số lượng sản phẩm của shop cũng đổi.
function invalidateProductQueries(queryClient, productId) {
  const tasks = [
    queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_KEY }),
    queryClient.invalidateQueries({ queryKey: ["products"] }),
    queryClient.invalidateQueries({ queryKey: MY_SHOP_KEY }),
  ];
  if (productId != null) {
    tasks.push(queryClient.invalidateQueries({ queryKey: sellerProductKey(productId) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: ["product", String(productId)] }));
  }
  return Promise.all(tasks);
}

// params: { q, status, page, size }
export function useSellerProducts(params) {
  return useQuery({
    queryKey: [...SELLER_PRODUCTS_KEY, params],
    queryFn: () => fetchSellerProducts(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData, // giữ bảng cũ khi đổi trang/tìm kiếm
  });
}

export function useSellerProduct(productId) {
  return useQuery({
    queryKey: sellerProductKey(productId),
    queryFn: () => fetchSellerProduct(productId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

export function useCreateSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSellerProduct,
    onSuccess: (product) => invalidateProductQueries(queryClient, product?.id),
  });
}

export function useUpdateSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSellerProduct,
    onSuccess: (_product, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

export function useDeleteSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSellerProduct,
    onSuccess: (_result, productId) => invalidateProductQueries(queryClient, productId),
  });
}

export function useCreateProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductVariant,
    onSuccess: (_variant, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

export function useUpdateProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductVariant,
    onSuccess: (_variant, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

export function useDeleteProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductVariant,
    onSuccess: (_result, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

// Upload: KHÔNG optimistic update — ảnh chỉ hiện khi server đã lưu xong.
export function useUploadProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProductImage,
    onSuccess: (_image, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductImage,
    onSuccess: (_result, variables) => invalidateProductQueries(queryClient, variables.productId),
  });
}
