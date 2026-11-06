import { apiClient } from "./client";

// API quản trị sản phẩm cho website single-brand.
// Chỉ hàm thuần trả Promise, không import react / @tanstack/react-query.

// params: { q, status, page, size }
export async function fetchAdminProducts(params) {
  const { data } = await apiClient.get("/admin/products", { params });
  return data.result; // PageResponse<SellerProductResponse>
}

export async function fetchAdminProduct(productId) {
  const { data } = await apiClient.get(`/admin/products/${productId}`);
  return data.result; // SellerProductResponse
}

// payload: { name, description, categoryId, variants[] }
export async function createAdminProduct(payload) {
  const { data } = await apiClient.post("/admin/products", payload);
  return data.result;
}

// { productId, name, description, categoryId }
export async function updateAdminProduct({ productId, ...payload }) {
  const { data } = await apiClient.put(`/admin/products/${productId}`, payload);
  return data.result;
}

export async function deleteAdminProduct(productId) {
  await apiClient.delete(`/admin/products/${productId}`);
  return productId; // xoá mềm (status = DELETED)
}

// payload: { sku, attributes, priceMinor, stockQuantity, imageUrl }
export async function createAdminProductVariant({ productId, ...payload }) {
  const { data } = await apiClient.post(`/admin/products/${productId}/variants`, payload);
  return data.result; // ProductVariantResponse
}

// PUT variant là cập nhật toàn phần: luôn gửi đủ priceMinor + stockQuantity
export async function updateAdminProductVariant({ productId, variantId, ...payload }) {
  const { data } = await apiClient.put(`/admin/products/${productId}/variants/${variantId}`, payload);
  return data.result;
}

export async function deleteAdminProductVariant({ productId, variantId }) {
  await apiClient.delete(`/admin/products/${productId}/variants/${variantId}`);
  return variantId;
}

// Upload 1 ảnh: multipart/form-data với key "file".
// KHÔNG tự set Content-Type để axios tự thêm boundary.
export async function uploadAdminProductImage({ productId, file }) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(`/admin/products/${productId}/images`, formData);
  return data.result; // ProductImageResponse
}

export async function deleteAdminProductImage({ productId, imageId }) {
  await apiClient.delete(`/admin/products/${productId}/images/${imageId}`);
  return imageId;
}
