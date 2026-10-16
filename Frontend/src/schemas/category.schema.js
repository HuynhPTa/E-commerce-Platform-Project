import { z } from "zod";

// Khớp với CategoryRequest ở Backend. parentId: "" = danh mục gốc.
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Tên danh mục không được để trống").max(120, "Tối đa 120 ký tự"),
  slug: z.string().trim().max(140, "Tối đa 140 ký tự")
    .refine((v) => v === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v),
      "Chỉ gồm chữ thường không dấu, số và dấu gạch ngang"),
  parentId: z.string(),
  icon: z.string(),
  sortOrder: z.coerce.number().int().min(0, "Phải >= 0"),
});

// Giống SlugUtil ở Backend: chỉ để xem trước, BE mới là nơi quyết định slug cuối cùng
export function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
