import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, register, fetchMe } from "../api/auth.api";
import { ME_KEY, ME_STALE_TIME } from "./useMe";

// Mutation làm thay đổi dữ liệu + xử lý cache sau mutation.
export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      if (!data?.token) {
        console.error("Không có token:", data);
        return;
      }
      localStorage.setItem("access_token", data.token);
      // prefetchQuery (không dùng invalidate): query useMe đang enabled:false lúc
      // chưa có token, invalidate sẽ không kích hoạt gọi API.
      await queryClient.prefetchQuery({
        queryKey: ME_KEY,
        queryFn: fetchMe,
        staleTime: ME_STALE_TIME,
      });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: register });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    localStorage.removeItem("access_token");
    // Xoá cache để người dùng kế tiếp không thấy hồ sơ của người trước
    queryClient.removeQueries({ queryKey: ME_KEY });
  };
}