import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMe } from "../api/user.api";
import { ME_KEY } from "./useMe";

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    // Server đã trả hồ sơ mới, ghi thẳng vào cache, không cần gọi lại GET /me.
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(ME_KEY, updatedUser);
    },
  });
}