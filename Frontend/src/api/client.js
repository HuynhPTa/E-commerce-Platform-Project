import axios from "axios";

// api/ — QUY TẮC BẮT BUỘC: không import "react" hay "@tanstack/react-query"
// ở bất kỳ file nào trong folder này. Mỗi file chỉ export hàm thuần trả Promise.
// Lý do: nếu logic cache lẫn vào đây, ranh giới client-state/server-state bị nhoà
// và không trả lời được câu "nếu bỏ TanStack Query, phải tự quản lý gì?"

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
    }
    return Promise.reject(error);
  }
);
