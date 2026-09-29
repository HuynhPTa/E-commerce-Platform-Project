import { z } from "zod";

// Dùng cho validateSearch của route /products — đây chính là điều kiện bắt buộc
// ở §4.3: "products/index.jsx dùng validateSearch (Zod) cho params
// category/minPrice/sort/page". Thiếu cái này thì TanStack Router chỉ đang được
// dùng như link điều hướng thường, không tính là dùng đúng thế mạnh của nó.
export const productSearchSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "best_selling"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().optional(),
});
