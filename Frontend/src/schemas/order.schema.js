import { z } from "zod";

// Search params của trang /orders: /orders?status=SHIPPING&page=2
export const myOrdersSearchSchema = z.object({
  status: z.enum(["ALL", "PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED"])
    .default("ALL").catch("ALL"),
  page: z.coerce.number().int().min(1).default(1).catch(1),
});
