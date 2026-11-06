import { z } from "zod";

// Tệp này khai báo quy tắc kiểm tra dữ liệu cho các biểu mẫu quản trị.
// Giá và tồn kho để dạng chuỗi trong biểu mẫu để ô rỗng không bị đổi thành 0.

const giaBan = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập giá bán")
  .regex(/^\d+$/, "Giá phải là số nguyên không âm")
  .transform(Number);

const soLuongTon = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập tồn kho")
  .regex(/^\d+$/, "Tồn kho phải là số nguyên không âm")
  .transform(Number);

const dongThuocTinh = z.object({
  key: z.string().max(100, "Tên thuộc tính tối đa 100 ký tự"),
  value: z.string().max(100, "Giá trị tối đa 100 ký tự"),
});

// Quy tắc cho biến thể sản phẩm.
export const phienBanSchema = z
  .object({
    sku: z.string().trim().max(64, "SKU tối đa 64 ký tự"),
    priceMinor: giaBan,
    stockQuantity: soLuongTon,
    attributes: z.array(dongThuocTinh).max(20, "Tối đa 20 thuộc tính"),
  })
  .superRefine(function (duLieu, nguCanh) {
    // Biến này lưu các tên thuộc tính đã gặp để phát hiện trùng lặp.
    const tenDaGap = new Set();

    // Biến này lưu vị trí của dòng thuộc tính đang xét.
    let chiSo = 0;

    while (chiSo < duLieu.attributes.length) {
      const dongHienTai = duLieu.attributes[chiSo];
      const tenThuocTinh = dongHienTai.key.trim();
      const giaTriThuocTinh = dongHienTai.value.trim();

      if (tenThuocTinh === "") {
        if (giaTriThuocTinh === "") {
          chiSo = chiSo + 1;
          continue;
        }
      }

      if (tenThuocTinh === "") {
        nguCanh.addIssue({
          code: "custom",
          path: ["attributes", chiSo, "key"],
          message: "Nhập tên thuộc tính",
        });
        chiSo = chiSo + 1;
        continue;
      }

      if (giaTriThuocTinh === "") {
        nguCanh.addIssue({
          code: "custom",
          path: ["attributes", chiSo, "value"],
          message: "Nhập giá trị thuộc tính",
        });
        chiSo = chiSo + 1;
        continue;
      }

      if (tenThuocTinh.length > 100) {
        nguCanh.addIssue({
          code: "custom",
          path: ["attributes", chiSo, "key"],
          message: "Tối đa 100 ký tự",
        });
        chiSo = chiSo + 1;
        continue;
      }

      if (giaTriThuocTinh.length > 100) {
        nguCanh.addIssue({
          code: "custom",
          path: ["attributes", chiSo, "key"],
          message: "Tối đa 100 ký tự",
        });
        chiSo = chiSo + 1;
        continue;
      }

      const tenChuanHoa = tenThuocTinh.toLowerCase();

      if (tenDaGap.has(tenChuanHoa) === true) {
        nguCanh.addIssue({
          code: "custom",
          path: ["attributes", chiSo, "key"],
          message: "Tên thuộc tính bị trùng",
        });
      }

      tenDaGap.add(tenChuanHoa);
      chiSo = chiSo + 1;
    }
  });

// Quy tắc cho thông tin chung của sản phẩm.
export const sanPhamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên sản phẩm không được để trống")
    .max(200, "Tên sản phẩm tối đa 200 ký tự"),
  description: z.string().trim().max(5000, "Mô tả tối đa 5000 ký tự"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
});

// Quy tắc cho biểu mẫu tạo mới, kèm biến thể đầu tiên.
export const sanPhamTaoMoiSchema = sanPhamSchema.extend({
  sku: z.string().trim().max(64, "SKU tối đa 64 ký tự"),
  priceMinor: giaBan,
  stockQuantity: soLuongTon,
});

// Quy tắc cho biểu mẫu danh mục.
export const danhMucSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên danh mục không được để trống")
    .max(120, "Tối đa 120 ký tự"),
  slug: z
    .string()
    .trim()
    .max(140, "Tối đa 140 ký tự")
    .refine(
      function (giaTri) {
        if (giaTri === "") {
          return true;
        }

        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(giaTri);
      },
      "Chỉ gồm chữ thường không dấu, số và dấu gạch ngang",
    ),
  parentId: z.string(),
  icon: z.string(),
  sortOrder: z.coerce.number().int().min(0, "Phải >= 0"),
});
