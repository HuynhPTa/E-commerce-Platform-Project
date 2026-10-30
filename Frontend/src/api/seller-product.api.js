import { apiClient } from "./client";

// api/ — chỉ hàm thuần trả Promise, không import react / @tanstack/react-query.
// Hợp đồng: docs/api-seller-products.md (gói A).

// params: { q, status, page, size }
export async function fetchSellerProducts(params) {
  const { data } = await apiClient.get("/seller/products", { params });
  return data.result; // PageResponse<SellerProductResponse>
}

export async function fetchSellerProduct(productId) {
  const { data } = await apiClient.get(`/seller/products/${productId}`);
  return data.result; // SellerProductResponse
}

// payload: { name, description, categoryId, variants[] }
export async function createSellerProduct(payload) {
  const { data } = await apiClient.post("/seller/products", payload);
  return data.result;
}

// { productId, name, description, categoryId }
export async function updateSellerProduct({ productId, ...payload }) {
  const { data } = await apiClient.put(`/seller/products/${productId}`, payload);
  return data.result;
}

export async function deleteSellerProduct(productId) {
  await apiClient.delete(`/seller/products/${productId}`);
  return productId; // xoá mềm (status = DELETED)
}

// payload: { sku, attributes, priceMinor, stockQuantity, imageUrl }
export async function createProductVariant({ productId, ...payload }) {
  const { data } = await apiClient.post(`/seller/products/${productId}/variants`, payload);
  return data.result; // ProductVariantResponse
}

// PUT variant là cập nhật toàn phần: luôn gửi đủ priceMinor + stockQuantity
export async function updateProductVariant({ productId, variantId, ...payload }) {
  const { data } = await apiClient.put(`/seller/products/${productId}/variants/${variantId}`, payload);
  return data.result;
}

export async function deleteProductVariant({ productId, variantId }) {
  await apiClient.delete(`/seller/products/${productId}/variants/${variantId}`);
  return variantId;
}

// Upload 1 ảnh: multipart/form-data với key "file".
// KHÔNG tự set Content-Type để axios tự thêm boundary.
export async function uploadProductImage({ productId, file }) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(`/seller/products/${productId}/images`, formData);
  return data.result; // ProductImageResponse
}

export async function deleteProductImage({ productId, imageId }) {
  await apiClient.delete(`/seller/products/${productId}/images/${imageId}`);
  return imageId;
}
