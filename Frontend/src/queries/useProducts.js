import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchProductById } from "../api/product.api";

// Query key phân cấp: ['products', filters] — filters đổi => key đổi => cache tách riêng
// theo từng tổ hợp bộ lọc, không phải 1 cache dùng chung cho mọi trang/filter.
export function useProductsQuery(filters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 3 * 60 * 1000, // danh sách sản phẩm không đổi liên tục
    placeholderData: (previousData) => previousData, // giữ data cũ khi đổi trang, tránh nháy UI
  });
}

export function useProductQuery(productId) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProductById(productId),
    staleTime: 2 * 60 * 1000, // ngắn hơn list vì có review/giá cập nhật thường xuyên hơn
    enabled: !!productId,
  });
}
