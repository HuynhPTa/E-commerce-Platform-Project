import { apiClient } from "./client";

export async function fetchAddresses() {
  const { data } = await apiClient.get("/addresses");
  return data.result; // AddressResponse[]
}
export async function createAddress(payload) {
  const { data } = await apiClient.post("/addresses", payload);
  return data.result;
}
export async function updateAddress({ id, ...payload }) {
  const { data } = await apiClient.put(`/addresses/${id}`, payload);
  return data.result;
}
export async function deleteAddress(id) {
  await apiClient.delete(`/addresses/${id}`);
  return id;
}
export async function setDefaultAddress(id) {
  const { data } = await apiClient.put(`/addresses/${id}/default`);
  return data.result;
}