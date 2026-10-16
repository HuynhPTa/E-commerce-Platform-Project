import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitCheckout } from "../api/checkout.api";

// Tầng 1B — "Không optimistic cho đặt hàng vì liên quan tiền".
// Khác hẳn useAddToCartMutation: ở đây KHÔNG có onMutate optimistic.
// Lý do: nếu optimistic rồi rollback, người dùng có thể đã bấm "thanh toán" 2 lần,
// hoặc thấy đơn "thành công" trong khi thực ra BE vừa từ chối vì hết hàng/thanh toán lỗi.
// Phải chờ response thật từ BE rồi mới điều hướng sang trang kết quả/redirectUrl.
export function useCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitCheckout,
    onSuccess: () => {
      // Giỏ hàng đã được BE xoá sau khi tạo order thành công → đồng bộ lại
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] });
    },
    // Không có onMutate/onError rollback vì không có gì để rollback —
    // UI chỉ hiển thị loading cho tới khi có response thật.
  });
}
