import axios from "axios";

// api/ — QUY TẮC BẮT BUỘC: không import "react" hay "@tanstack/react-query"
// ở bất kỳ file nào trong folder này. Mỗi file chỉ export hàm thuần trả Promise.
// Lý do: nếu logic cache lẫn vào đây, ranh giới client-state/server-state bị nhoà
// và không trả lời được câu "nếu bỏ TanStack Query, phải tự quản lý gì?"

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
});

// Các endpoint công khai: KHÔNG gắn token.
// Backend giải mã Bearer token ở mọi request có header Authorization, kể cả endpoint
// permitAll, nên token cũ/hỏng sẽ làm login/register bị 401.
const PUBLIC_PATHS = ["/auth/login", "/auth/register"];

const isPublic = (url) => PUBLIC_PATHS.some((p) => url?.startsWith(p));

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  // token !== "undefined": chặn giá trị hỏng do setItem(..., undefined) trước đó
  if (token && token !== "undefined" && !isPublic(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Chỉ xoá token khi request có token bị từ chối; lỗi của login/register thì bỏ qua
    if (error.response?.status === 401 && !isPublic(error.config?.url)) {
      localStorage.removeItem("access_token");
    }
    return Promise.reject(error);
  }
);
