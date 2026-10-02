import { z } from "zod";

export const addressSchema = z.object({
  recipientName: z.string().trim().min(1, "Tên người nhận không được để trống").max(120),
  phone: z.string().trim().regex(/^[0-9]{9,11}$/, "Số điện thoại gồm 9 đến 11 chữ số"),
  fullAddress: z.string().trim().min(1, "Địa chỉ không được để trống").max(500),
});