import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, register, fetchMe } from "../api/auth.api";

// Minh chứng tối thiểu: "chỉ ra một dữ liệu server state và giải thích vòng đời cache".
// ['user', 'me'] LÀ server state — không phải state cục bộ của component nào.
export function useMeQuery() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000, // hồ sơ user ít đổi, coi là fresh trong 5 phút
    enabled: !!localStorage.getItem("access_token"),
  });
}

// Minh chứng tối thiểu: "ít nhất một mutation làm thay đổi dữ liệu + xử lý cache sau mutation".
export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.accessToken);
      // Câu hỏi tự kiểm: "Khi mutation thành công, vì sao query này cần invalidate/refetch?"
      // → Vì token vừa đổi, ['user','me'] đang cache theo phiên đăng nhập CŨ (hoặc rỗng).
      // Không invalidate thì UI sẽ hiển thị sai hồ sơ hoặc mãi ở trạng thái chưa đăng nhập.
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: register });
}
