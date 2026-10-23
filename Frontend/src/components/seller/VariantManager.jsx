import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import Modal from "../common/Modal";
import { errMsg } from "../../lib/errors";
import { formatVnd } from "../../lib/format";
import {
  attributeRowsToObject, attributesToRows, variantSchema,
} from "../../schemas/seller-product.schema";
import {
  useCreateProductVariant, useDeleteProductVariant, useUpdateProductVariant,
} from "../../queries/useSellerProducts";

const fieldClass = (hasError) => (hasError ? "field has-error" : "field");

function VariantFormModal({ product, variant, onClose }) {
  const isEdit = Boolean(variant?.id);
  const createMutation = useCreateProductVariant();
  const updateMutation = useUpdateProductVariant();

  const {
    register, control, handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      sku: variant?.sku ?? "",
      priceMinor: variant ? String(variant.priceMinor) : "",
      stockQuantity: variant ? String(variant.stockQuantity) : "",
      attributes: attributesToRows(variant?.attributes),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "attributes" });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  function submit(values) {
    const payload = {
      sku: values.sku?.trim() || null,
      attributes: attributeRowsToObject(values.attributes),
      priceMinor: values.priceMinor,
      stockQuantity: values.stockQuantity,
      imageUrl: variant?.imageUrl ?? null,
    };
    if (isEdit) {
      updateMutation.mutate(
        { productId: product.id, variantId: variant.id, ...payload },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate({ productId: product.id, ...payload }, { onSuccess: onClose });
    }
  }

  return (
    <Modal
      title={isEdit ? "Sửa biến thể" : "Thêm biến thể"}
      onClose={onClose}
      width={620}
      footer={
        <>
          <button type="button" onClick={onClose}>Huỷ</button>
          <button type="submit" form="variant-form" className="btn-primary" disabled={isPending}>
            {isPending ? <LoaderCircle size={16} className="spin" /> : null}
            {isEdit ? "Lưu thay đổi" : "Thêm biến thể"}
          </button>
        </>
      }
    >
      <form id="variant-form" onSubmit={handleSubmit(submit)} noValidate>
        <div className="form-row">
          <div className={fieldClass(errors.priceMinor)}>
            <label className="required" htmlFor="variant-price">Giá bán (₫)</label>
            <input id="variant-price" type="number" min="0" step="1" autoFocus {...register("priceMinor")} />
            {errors.priceMinor && <p className="error" role="alert">{errors.priceMinor.message}</p>}
          </div>
          <div className={fieldClass(errors.stockQuantity)}>
            <label className="required" htmlFor="variant-stock">Tồn kho</label>
            <input id="variant-stock" type="number" min="0" step="1" {...register("stockQuantity")} />
            {errors.stockQuantity && <p className="error" role="alert">{errors.stockQuantity.message}</p>}
          </div>
        </div>

        <div className={fieldClass(errors.sku)}>
          <label htmlFor="variant-sku">SKU</label>
          <input id="variant-sku" maxLength={64} placeholder="VD: AO-DEN-L" {...register("sku")} />
          {errors.sku
            ? <p className="error" role="alert">{errors.sku.message}</p>
            : <p className="hint">Không bắt buộc. SKU phải duy nhất trên toàn hệ thống.</p>}
        </div>

        <div className="field">
          <label>Thuộc tính</label>
          <p className="hint" style={{ marginTop: 0 }}>
            VD: color = Đen, size = L. Bỏ trống nếu sản phẩm chỉ có một loại.
          </p>
          {fields.map((field, index) => (
            <div className="attr-row" key={field.id}>
              <div>
                <input placeholder="Tên (vd: color)" maxLength={100} aria-label="Tên thuộc tính"
                       {...register(`attributes.${index}.key`)} />
                {errors.attributes?.[index]?.key && (
                  <p className="error" role="alert">{errors.attributes[index].key.message}</p>
                )}
              </div>
              <div>
                <input placeholder="Giá trị (vd: Đen)" maxLength={100} aria-label="Giá trị thuộc tính"
                       {...register(`attributes.${index}.value`)} />
                {errors.attributes?.[index]?.value && (
                  <p className="error" role="alert">{errors.attributes[index].value.message}</p>
                )}
              </div>
              <button type="button" className="btn-sm btn-ghost" title="Xoá thuộc tính"
                      onClick={() => remove(index)}>
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn-sm" onClick={() => append({ key: "", value: "" })}>
            <Plus size={14} /> Thêm thuộc tính
          </button>
        </div>

        {mutationError && (
          <div className="alert alert-danger" style={{ marginBottom: 0 }}>
            <TriangleAlert size={18} /><div>{errMsg(mutationError)}</div>
          </div>
        )}
      </form>
    </Modal>
  );
}

function VariantDeleteModal({ product, variant, onClose }) {
  const mutation = useDeleteProductVariant();
  return (
    <Modal
      title="Xoá biến thể"
      onClose={onClose}
      width={460}
      footer={
        <>
          <button onClick={onClose}>Huỷ</button>
          <button className="btn-danger" disabled={mutation.isPending}
                  onClick={() => mutation.mutate(
                    { productId: product.id, variantId: variant.id },
                    { onSuccess: onClose },
                  )}>
            {mutation.isPending ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} />} Xoá
          </button>
        </>
      }
    >
      <p>
        Xoá biến thể <strong>{variant.sku || `#${variant.id}`}</strong>
        {Object.keys(variant.attributes ?? {}).length > 0
          && ` (${Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")})`}?
      </p>
      <p className="muted">Biến thể đã có trong đơn hàng sẽ không thể xoá.</p>
      {mutation.isError && <div className="alert alert-danger"><TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div></div>}
    </Modal>
  );
}

export default function VariantManager({ product, disabled = false }) {
  const [editing, setEditing] = useState(null); // null | {} (tạo mới) | variant (sửa)
  const [deleting, setDeleting] = useState(null);
  const variants = product.variants ?? [];

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h3>Biến thể</h3>
          <div className="cell-sub">{variants.length} biến thể · phải còn ít nhất 1 biến thể</div>
        </div>
        <button className="btn btn-sm btn-outline" disabled={disabled} onClick={() => setEditing({})}>
          <Plus size={14} /> Thêm biến thể
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Thuộc tính</th>
              <th>Giá bán</th>
              <th>Tồn kho</th>
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const entries = Object.entries(v.attributes ?? {});
              return (
                <tr key={v.id}>
                  <td>
                    <strong>{v.sku || "—"}</strong>
                    <div className="cell-sub">#{v.id}</div>
                  </td>
                  <td>
                    {entries.length ? (
                      <div className="attr-chips">
                        {entries.map(([key, value]) => (
                          <span className="attr-chip" key={key}>{key}: {value}</span>
                        ))}
                      </div>
                    ) : <span className="muted">Mặc định</span>}
                  </td>
                  <td>{formatVnd(v.priceMinor)}</td>
                  <td>
                    {v.stockQuantity === 0
                      ? <span className="badge badge-danger">Hết hàng</span>
                      : v.stockQuantity}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-sm btn-ghost" title="Sửa biến thể" disabled={disabled}
                              onClick={() => setEditing(v)}>
                        <Pencil size={15} />
                      </button>
                      <button className="btn-sm btn-danger" disabled={disabled || variants.length <= 1}
                              title={variants.length <= 1
                                ? "Không thể xoá biến thể cuối cùng của sản phẩm"
                                : "Xoá biến thể"}
                              onClick={() => setDeleting(v)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <VariantFormModal product={product} variant={editing.id ? editing : null}
                          onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <VariantDeleteModal product={product} variant={deleting} onClose={() => setDeleting(null)} />
      )}
    </section>
  );
}
