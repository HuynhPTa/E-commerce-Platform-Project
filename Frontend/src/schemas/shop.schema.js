import { z } from "zod";

// Khớp với validation của ShopRequest ở Backend
export const shopSchema = z.object({
  name: z.string().trim().min(3, "Tên shop từ 3 ký tự").max(160, "Tên shop tối đa 160 ký tự"),
  description: z.string().trim().max(2000, "Mô tả tối đa 2000 ký tự"),
  logoUrl: z.string().trim().max(512, "Đường dẫn quá dài")
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://"),
  phone: z.string().trim().regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"),
  pickupAddress: z.string().trim().min(5, "Vui lòng nhập địa chỉ lấy hàng").max(255, "Địa chỉ tối đa 255 ký tự"),
  agree: z.literal(true, { error: "Bạn cần đồng ý với quy định dành cho người bán" }),
});

// Search params của trang shop public /shops/$shopId
export const shopProductsSearchSchema = z.object({
  sort: z.enum(["newest", "price_asc", "price_desc", "best_selling"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
});
