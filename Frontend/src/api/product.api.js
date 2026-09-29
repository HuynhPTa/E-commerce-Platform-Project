import { apiClient } from "./client";

// filters: { category, minPrice, maxPrice, sort, page, q }
export async function fetchProducts(filters) {
  const { data } = await apiClient.get("/products", { params: filters });
  return data; // PageResponse<ProductResponse>
}

export async function fetchProductById(productId) {
  const { data } = await apiClient.get(`/products/${productId}`);
  return data; // ProductResponse (kèm variants)
}
