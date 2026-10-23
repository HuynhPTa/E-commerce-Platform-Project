import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { LoaderCircle, Save, TriangleAlert } from "lucide-react";
import { useCategoryFlat } from "../../queries/useCategories";
import { sellerProductSchema, sellerProductCreateSchema } from "../../schemas/seller-product.schema";

const fieldClass = (hasError) => (hasError ? "field has-error" : "field");

// Dùng chung cho tạo mới (kèm biến thể đầu tiên) và sửa thông tin sản phẩm.
export default function ProductForm({ mode, product, onSubmit, isPending, error, disabled = false }) {
  const isCreate = mode === "create";
  const { data: categories = [], isLoading: categoriesLoading } = useCategoryFlat();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isCreate ? sellerProductCreateSchema : sellerProductSchema),
    defaultValues: isCreate
      ? { name: "", description: "", categoryId: "", sku: "", priceMinor: "", stockQuantity: "" }
      : {
          name: product.name ?? "",
          description: product.description ?? "",
          categoryId: product.categoryId ?? "",
        },
  });

  // Danh mục hiện tại có thể đã bị Admin xoá khỏi cây -> vẫn hiển thị để người bán biết
  const categoryMissing = !isCreate && product.categoryId
    && !categories.some((c) => String(c.id) === String(product.categoryId));

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack" style={{ gap: 16 }}>
      <section className="card">
        <div className="card-header"><h3>Thông tin sản phẩm</h3></div>
        <div className="card-body">
          <div className={fieldClass(errors.name)}>
            <label className="required" htmlFor="product-name">Tên sản phẩm</label>
            <input id="product-name" placeholder="VD: Áo thun nam basic cotton"
                   maxLength={200} disabled={disabled} autoFocus={!disabled} {...register("name")} />
            {errors.name && <p className="error" role="alert">{errors.name.message}</p>}
          </div>

          <div className={fieldClass(errors.categoryId)}>
            <label className="required" htmlFor="product-category">Danh mục</label>
            <select id="product-category" disabled={disabled || categoriesLoading} {...register("categoryId")}>
              <option value="">{categoriesLoading ? "Đang tải danh mục…" : "— Chọn danh mục —"}</option>
              {categoryMissing && (
                <option value={product.categoryId}>{product.categoryName ?? product.categoryId} (không còn trong cây danh mục)</option>
              )}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{"   ".repeat(c.depth)}{c.depth ? "└ " : ""}{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="error" role="alert">{errors.categoryId.message}</p>}
          </div>

          <div className={fieldClass(errors.description)}>
            <label htmlFor="product-description">Mô tả</label>
            <textarea id="product-description" rows={5} maxLength={5000} disabled={disabled}
                      placeholder="Chất liệu, kích thước, hướng dẫn sử dụng…" {...register("description")} />
            {errors.description
              ? <p className="error" role="alert">{errors.description.message}</p>
              : <p className="hint">Tối đa 5000 ký tự. Có thể để trống.</p>}
          </div>

          {error && <div className="alert alert-danger"><TriangleAlert size={18} /><div>{error}</div></div>}
        </div>
      </section>

      {isCreate && (
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Biến thể đầu tiên</h3>
              <div className="cell-sub">Sản phẩm cần ít nhất 1 biến thể để có giá bán.</div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className={fieldClass(errors.priceMinor)}>
                <label className="required" htmlFor="product-price">Giá bán (₫)</label>
                <input id="product-price" type="number" min="0" step="1" placeholder="VD: 250000"
                       disabled={disabled} {...register("priceMinor")} />
                {errors.priceMinor && <p className="error" role="alert">{errors.priceMinor.message}</p>}
              </div>
              <div className={fieldClass(errors.stockQuantity)}>
                <label className="required" htmlFor="product-stock">Tồn kho</label>
                <input id="product-stock" type="number" min="0" step="1" placeholder="VD: 20"
                       disabled={disabled} {...register("stockQuantity")} />
                {errors.stockQuantity && <p className="error" role="alert">{errors.stockQuantity.message}</p>}
              </div>
            </div>
            <div className={fieldClass(errors.sku)}>
              <label htmlFor="product-sku">SKU</label>
              <input id="product-sku" maxLength={64} disabled={disabled}
                     placeholder="VD: AO-DEN-L" {...register("sku")} />
              {errors.sku
                ? <p className="error" role="alert">{errors.sku.message}</p>
                : <p className="hint">Không bắt buộc. Nếu nhập, SKU phải duy nhất trên toàn hệ thống.</p>}
            </div>
            <p className="hint">Sau khi tạo, bạn có thể thêm biến thể màu/size khác và tải ảnh ở trang chi tiết.</p>
          </div>
        </section>
      )}

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Link to="/seller/products" className="btn">Huỷ</Link>
        <button type="submit" className="btn btn-primary" disabled={isPending || disabled}>
          {isPending ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
          {isCreate ? "Tạo sản phẩm" : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
