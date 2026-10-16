import { z } from "zod";

// Tầng 1B — "Form/validation nếu ứng dụng có biểu mẫu phức tạp".
// Điều kiện tối thiểu: >=4 field liên quan nhau (địa chỉ, SĐT, phương thức thanh toán, ghi chú).
export const checkoutSchema = z.object({
  recipientName: z.string().min(2, "Tên người nhận quá ngắn"),
  phone: z
    .string()
    .regex(/^0\d{9,10}$/, "Số điện thoại Việt Nam không hợp lệ"),
  fullAddress: z.string().min(10, "Địa chỉ cần chi tiết hơn (số nhà, đường, phường/xã)"),
  paymentMethod: z.enum(["VNPAY", "MOMO"], {
    errorMap: () => ({ message: "Chọn một phương thức thanh toán" }),
  }),
  note: z.string().max(200, "Ghi chú tối đa 200 ký tự").optional(),
});
