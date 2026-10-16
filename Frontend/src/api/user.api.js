import { apiClient } from "./client";

export async function updateMe(payload) {
  const { data } = await apiClient.put("/me", payload);
  return data.result; // UserResponse mới
}