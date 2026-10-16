import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Họ không được để trống").max(50),
  lastName: z.string().trim().min(1, "Tên không được để trống").max(50),
  phone: z.string().trim().regex(/^$|^[0-9]{9,11}$/, "Số điện thoại gồm 9 đến 11 chữ số"),
  dateOfBirth: z.string(), // "" hoặc "YYYY-MM-DD" từ <input type="date">
});