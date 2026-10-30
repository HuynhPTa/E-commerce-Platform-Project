import { API_ORIGIN } from "./assetUrl";

// Hai provider đã cấu hình ở Backend (Spring Security OAuth2 client).
// Đăng ký mới cũng đi qua cùng luồng: Backend tự tạo user nếu email chưa tồn tại.
export const OAUTH2_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
];

// Endpoint mặc định của Spring Security: /oauth2/authorization/{registrationId}
export function oauth2LoginUrl(provider) {
  return `${API_ORIGIN}/oauth2/authorization/${provider}`;
}
