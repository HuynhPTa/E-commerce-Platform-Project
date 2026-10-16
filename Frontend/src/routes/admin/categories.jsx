import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown, Search, FolderTree, LoaderCircle, CornerDownRight,
  TriangleAlert, ExternalLink,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  useCategoryFlat, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from "../../queries/useCategories";
import { categorySchema, toSlug } from "../../schemas/category.schema";
import { descendantIds } from "../../lib/categoryTree";
import { errMsg } from "../../lib/errors";
import Modal from "../../components/common/Modal";
import CategoryIcon from "../../components/category/CategoryIcon";
import { ICON_NAMES } from "../../components/category/categoryIcons";

// editing: { mode: "create", parentId } | { mode: "edit", category }
function CategoryFormModal({ editing, flat, onClose }) {
  const isEdit = editing.mode === "edit";
  const current = isEdit ? editing.category : null;
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const mutation = isEdit ? updateMut : createMut;

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: current?.name ?? "",
      slug: current?.slug ?? "",
      parentId: String(current?.parentId ?? editing.parentId ?? ""),
      icon: current?.icon ?? "",
      sortOrder: current?.sortOrder ?? 0,
    },
  });
  const [name, slug, icon, parentId] = useWatch({ control, name: ["name", "slug", "icon", "parentId"] });

  // Không cho chọn chính nó hoặc con cháu của nó làm cha (BE cũng chặn)
  const blocked = useMemo(() => (current ? descendantIds(flat, current.id) : new Set()), [flat, current]);

  const onSubmit = (v) => {
    const payload = {
      name: v.name,
      slug: v.slug,
      parentId: v.parentId === "" ? null : Number(v.parentId),
      icon: v.icon,
      sortOrder: v.sortOrder,
    };
    mutation.mutate(isEdit ? { id: current.id, ...payload } : payload, { onSuccess: onClose });
  };

  const field = (n) => `field${errors[n] ? " has-error" : ""}`;

  return (
    <Modal title={isEdit ? `Sửa danh mục “${current.name}”` : "Thêm danh mục"} onClose={onClose} width={560}
      footer={<>
        <button onClick={onClose}>Huỷ</button>
        <button className="btn-primary" form="category-form" type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <LoaderCircle size={16} className="spin" />} {isEdit ? "Lưu thay đổi" : "Thêm danh mục"}
        </button>
      </>}>
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={field("name")}>
          <label className="required" htmlFor="cat-name">Tên danh mục</label>
          <input id="cat-name" autoFocus placeholder="VD: Điện thoại & Phụ kiện" {...register("name")} />
          {errors.name && <p className="error">{errors.name.message}</p>}
        </div>

        <div className={field("slug")}>
          <label htmlFor="cat-slug">Slug (đường dẫn)</label>
          <input id="cat-slug" placeholder={toSlug(name || "") || "tu-dong-tao-tu-ten"} {...register("slug")} />
          {errors.slug ? <p className="error">{errors.slug.message}</p>
            : <p className="hint">/products?category=<b>{slug || toSlug(name || "") || "…"}</b> — bỏ trống để tự tạo từ tên.</p>}
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cat-parent">Danh mục cha</label>
            <select id="cat-parent" {...register("parentId")}>
              <option value="">— Không có (danh mục gốc) —</option>
              {flat.filter((c) => !blocked.has(c.id)).map((c) => (
                <option key={c.id} value={c.id}>{"   ".repeat(c.depth)}{c.depth ? "└ " : ""}{c.name}</option>
              ))}
            </select>
          </div>
          <div className={field("sortOrder")}>
            <label htmlFor="cat-order">Thứ tự hiển thị</label>
            <input id="cat-order" type="number" min="0" {...register("sortOrder")} />
            {errors.sortOrder && <p className="error">{errors.sortOrder.message}</p>}
          </div>
        </div>

        <div className="field">
          <label>Biểu tượng {parentId !== "" && <span className="muted">(thường chỉ hiển thị ở danh mục gốc)</span>}</label>
          <div className="icon-picker">
            <button type="button" className={icon === "" ? "selected" : ""} onClick={() => setValue("icon", "")} title="Không dùng">—</button>
            {ICON_NAMES.map((n) => (
              <button type="button" key={n} title={n} className={icon === n ? "selected" : ""} onClick={() => setValue("icon", n)}>
                <CategoryIcon name={n} size={18} />
              </button>
            ))}
          </div>
        </div>

        {mutation.isError && <div className="alert alert-danger"><TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div></div>}
      </form>
    </Modal>
  );
}

function DeleteModal({ category, onClose }) {
  const mutation = useDeleteCategory();
  return (
    <Modal title="Xoá danh mục" onClose={onClose} width={440}
      footer={<>
        <button onClick={onClose}>Huỷ</button>
        <button className="btn-danger" disabled={mutation.isPending} onClick={() => mutation.mutate(category.id, { onSuccess: onClose })}>
          {mutation.isPending ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} />} Xoá
        </button>
      </>}>
      <p>Bạn chắc chắn muốn xoá danh mục <strong>{category.name}</strong>?</p>
      <p className="muted">Chỉ xoá được danh mục không còn danh mục con và chưa có sản phẩm.</p>
      {mutation.isError && <div className="alert alert-danger"><TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div></div>}
    </Modal>
  );
}

export default function AdminCategoriesPage() {
  const { data: flat = [], isLoading, isError } = useCategoryFlat();
  const [keyword, setKeyword] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const byId = useMemo(() => new Map(flat.map((c) => [c.id, c])), [flat]);
  const childCount = useMemo(() => {
    const m = new Map();
    flat.forEach((c) => c.parentId != null && m.set(c.parentId, (m.get(c.parentId) ?? 0) + 1));
    return m;
  }, [flat]);

  // Khi tìm kiếm: hiện các danh mục khớp kèm toàn bộ tổ tiên để giữ ngữ cảnh cây
  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      const keep = new Set();
      flat.forEach((c) => {
        if (c.name.toLowerCase().includes(kw) || c.slug.includes(kw)) {
          for (let p = c; p; p = byId.get(p.parentId)) keep.add(p.id);
        }
      });
      return flat.filter((c) => keep.has(c.id));
    }
    return flat.filter((c) => {
      for (let p = byId.get(c.parentId); p; p = byId.get(p.parentId)) if (collapsed.has(p.id)) return false;
      return true;
    });
  }, [flat, byId, keyword, collapsed]);

  const toggle = (id) => setCollapsed((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <section className="card">
      <div className="card-header">
        <div className="row" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={16} className="muted" />
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo tên hoặc slug…" />
        </div>
        <div className="row">
          <span className="muted">{flat.length} danh mục</span>
          <button className="btn-primary" onClick={() => setEditing({ mode: "create", parentId: null })}>
            <Plus size={16} /> Thêm danh mục
          </button>
        </div>
      </div>

      {isLoading && <div className="center-box"><LoaderCircle className="spin" /> Đang tải danh mục…</div>}
      {isError && <div className="alert alert-danger" style={{ margin: 16 }}>Không tải được danh mục.</div>}
      {!isLoading && visible.length === 0 && (
        <div className="center-box"><FolderTree size={44} /> {keyword ? "Không có danh mục khớp từ khoá." : "Chưa có danh mục nào."}</div>
      )}

      {visible.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Tên danh mục</th><th>Slug</th><th>Danh mục cha</th><th>Thứ tự</th><th>Con</th><th style={{ textAlign: "right" }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const kids = childCount.get(c.id) ?? 0;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="tree-name">
                        <span className="tree-indent" style={{ width: c.depth * 24 }} />
                        {kids > 0 && !keyword ? (
                          <button className="cat-toggle" onClick={() => toggle(c.id)} aria-label="Mở/thu gọn">
                            {collapsed.has(c.id) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          </button>
                        ) : <span className="cat-toggle-spacer" />}
                        {c.depth === 0
                          ? <span className="icon-chip"><CategoryIcon name={c.icon} size={16} /></span>
                          : <CornerDownRight size={14} className="muted" />}
                        <strong style={{ fontWeight: c.depth === 0 ? 600 : 500 }}>{c.name}</strong>
                      </div>
                    </td>
                    <td><code className="cell-sub">{c.slug}</code></td>
                    <td className="muted">{byId.get(c.parentId)?.name ?? "—"}</td>
                    <td>{c.sortOrder}</td>
                    <td>{kids > 0 ? <span className="badge badge-info">{kids}</span> : <span className="muted">0</span>}</td>
                    <td>
                      <div className="actions">
                        <Link to="/products" search={{ category: c.slug }} target="_blank" className="btn btn-sm btn-ghost" title="Xem trên trang mua sắm">
                          <ExternalLink size={14} />
                        </Link>
                        <button className="btn-sm" title="Thêm danh mục con" onClick={() => setEditing({ mode: "create", parentId: c.id })}>
                          <Plus size={14} /> Con
                        </button>
                        <button className="btn-sm" title="Sửa" onClick={() => setEditing({ mode: "edit", category: c })}><Pencil size={14} /></button>
                        <button className="btn-sm btn-danger" title="Xoá" onClick={() => setDeleting(c)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <CategoryFormModal editing={editing} flat={flat} onClose={() => setEditing(null)} />}
      {deleting && <DeleteModal category={deleting} onClose={() => setDeleting(null)} />}
    </section>
  );
}
