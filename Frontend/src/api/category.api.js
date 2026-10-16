import { apiClient } from "./client";

// Cây danh mục lồng nhau: [{ id, name, slug, icon, depth, children: [...] }]
export async function fetchCategoryTree() {
  const { data } = await apiClient.get("/categories");
  return data.result;
}

// Danh sách phẳng theo thứ tự cây, mỗi phần tử có depth + parentId
export async function fetchCategoryFlat() {
  const { data } = await apiClient.get("/categories/flat");
  return data.result;
}

// ---- Chỉ Admin ----
export async function createCategory(payload) {
  const { data } = await apiClient.post("/categories", payload);
  return data.result;
}

export async function updateCategory({ id, ...payload }) {
  const { data } = await apiClient.put(`/categories/${id}`, payload);
  return data.result;
}

export async function deleteCategory(id) {
  await apiClient.delete(`/categories/${id}`);
  return id;
}
