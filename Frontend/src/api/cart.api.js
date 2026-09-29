import { apiClient } from "./client";

export async function fetchCart() {
  const { data } = await apiClient.get("/cart");
  return data; // CartItemResponse[]
}

export async function addToCart({ variantId, quantity }) {
  const { data } = await apiClient.post("/cart", { variantId, quantity });
  return data;
}

export async function updateCartItem({ itemId, quantity }) {
  const { data } = await apiClient.put(`/cart/${itemId}`, { quantity });
  return data;
}

export async function removeCartItem(itemId) {
  await apiClient.delete(`/cart/${itemId}`);
  return itemId;
}
