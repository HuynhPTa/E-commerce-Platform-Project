import { z } from "zod";

// Khớp ProductCreateRequest / ProductUpdateRequest / VariantRequest ở Backend.
// Giá và tồn kho để dạng chuỗi trong form (input rỗng không bị coerce thành 0),
// chỉ chuyển sang number khi submit.

const priceMinor = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập giá bán")
  .regex(/^\d+$/, "Giá phải là số nguyên không âm")
  .transform(Number);

const stockQuantity = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập tồn kho")
  .regex(/^\d+$/, "Tồn kho phải là số nguyên không âm")
  .transform(Number);

const attributeRow = z.object({
  key: z.string().max(100, "Tên thuộc tính tối đa 100 ký tự"),
  value: z.string().max(100, "Giá trị tối đa 100 ký tự"),
});

export const variantSchema = z
  .object({
    sku: z.string().trim().max(64, "SKU tối đa 64 ký tự"),
    priceMinor,
    stockQuantity,
    attributes: z.array(attributeRow).max(20, "Tối đa 20 thuộc tính"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set();
    data.attributes.forEach((row, index) => {
      const key = row.key.trim();
      const value = row.value.trim();
      if (!key && !value) return; // dòng trống hoàn toàn thì bỏ qua
      if (!key) {
        ctx.addIssue({ code: "custom", path: ["attributes", index, "key"], message: "Nhập tên thuộc tính" });
        return;
      }
      if (!value) {
        ctx.addIssue({ code: "custom", path: ["attributes", index, "value"], message: "Nhập giá trị thuộc tính" });
        return;
      }
      if (key.length > 100 || value.length > 100) {
        ctx.addIssue({ code: "custom", path: ["attributes", index, "key"], message: "Tối đa 100 ký tự" });
        return;
      }
      const normalized = key.toLowerCase();
      if (seen.has(normalized)) {
        ctx.addIssue({ code: "custom", path: ["attributes", index, "key"], message: "Tên thuộc tính bị trùng" });
      }
      seen.add(normalized);
    });
  });

export const sellerProductSchema = z.object({
  name: z.string().trim().min(1, "Tên sản phẩm không được để trống").max(200, "Tên sản phẩm tối đa 200 ký tự"),
  description: z.string().trim().max(5000, "Mô tả tối đa 5000 ký tự"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
});

// Form tạo mới kèm biến thể đầu tiên (tránh sản phẩm ACTIVE với variant mặc định 0₫).
export const sellerProductCreateSchema = sellerProductSchema.extend({
  sku: z.string().trim().max(64, "SKU tối đa 64 ký tự"),
  priceMinor,
  stockQuantity,
});

export function attributeRowsToObject(rows) {
  return (rows ?? []).reduce((result, row) => {
    const key = row.key?.trim();
    if (key) result[key] = row.value?.trim() ?? "";
    return result;
  }, {});
}

export function attributesToRows(attributes) {
  const entries = Object.entries(attributes ?? {});
  return entries.length ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }];
}
