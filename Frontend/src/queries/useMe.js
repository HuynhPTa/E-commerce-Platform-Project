import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../api/auth.api";

export const ME_KEY = ["user", "me"];
export const ME_STALE_TIME = 5 * 60 * 1000; // hồ sơ user ít đổi: fresh trong 5 phút

export function hasToken() {
  const t = localStorage.getItem("access_token");
  return !!t && t !== "undefined";
}

// ['user','me'] là SERVER STATE: nằm trong cache của TanStack Query,
// không phải state cục bộ của component nào.
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: fetchMe,
    staleTime: ME_STALE_TIME,
    enabled: hasToken(), // chưa đăng nhập thì không gọi /me
    retry: false,        // 401 thì thử lại cũng vô ích
  });
}