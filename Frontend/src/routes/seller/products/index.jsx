import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft, ChevronRight, ImageOff, Inbox, LoaderCircle, PackagePlus, Pencil, Plus,
  Search, Trash2, TriangleAlert,
} from "lucide-react";
import { useDeleteSellerProduct, useSellerProducts } from "../../../queries/useSellerProducts";
import { useDebounce } from "../../../hooks/useDebounce";
import Modal from "../../../components/common/Modal";
import { errMsg, formatDate } from "../../../lib/errors";
import { formatVnd } from "../../../lib/format";

const TABS = [
  { key: "ACTIVE", label: "Đang bán" },
  { key: "DELETED", label: "Đã xoá" },
];

function priceRange(product) {
  const prices = (product.variants ?? []).map((v) => v.priceMinor);
  if (!prices.length) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatVnd(min) : `${formatVnd(min)} – ${formatVnd(max)}`;
}

function totalStock(product) {
  return (product.variants ?? []).reduce((sum, v) => sum + v.stockQuantity, 0);
}

function ProductThumb({ product }) {
  return product.thumbnailUrl
    ? <img className="product-thumb" src={product.thumbnailUrl} alt="" loading="lazy" />
    : <span className="product-thumb product-thumb-empty"><ImageOff size={18} /></span>;
}

function DeleteProductModal({ product, onClose, onDeleted }) {
  const mutation = useDeleteSellerProduct();
  return (
    <Modal
      title="Xoá sản phẩm"
      onClose={onClose}
      width={480}
      footer={
        <>
          <button onClick={onClose}>Huỷ</button>
          <button className="btn-danger" disabled={mutation.isPending}
                  onClick={() => mutation.mutate(product.id, {
                    onSuccess: () => { onDeleted?.(); onClose(); },
                  })}>
            {mutation.isPending ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} />} Xoá sản phẩm
          </button>
        </>
      }
    >
      <div className="cell-main" style={{ marginBottom: 12 }}>
        <ProductThumb product={product} />
        <div><strong>{product.name}</strong><div className="cell-sub">#{product.id}</div></div>
      </div>
      <p>Sản phẩm sẽ bị ẩn khỏi trang mua sắm (xoá mềm) và không thể thêm vào giỏ.</p>
      <p className="muted">Bạn vẫn xem lại được trong tab “Đã xoá”, nhưng không thể chỉnh sửa.</p>
      {mutation.isError && <div className="alert alert-danger"><TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div></div>}
    </Modal>
  );
}

export default function SellerProductsPage() {
  const [tab, setTab] = useState("ACTIVE");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const q = useDebounce(keyword.trim(), 400);

  const { data, isLoading, isError, isFetching } = useSellerProducts({
    status: tab,
    q: q || undefined,
    page,
    size: 10,
  });

  const changeTab = (key) => { setTab(key); setPage(1); };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Sản phẩm của shop</h1>
          <p className="muted" style={{ margin: 0 }}>Quản lý thông tin, biến thể và ảnh sản phẩm.</p>
        </div>
        <Link to="/seller/products/new" className="btn btn-primary">
          <Plus size={16} /> Thêm sản phẩm
        </Link>
      </div>

      <section className="card">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => changeTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="card-header">
          <div className="row" style={{ flex: 1, maxWidth: 420 }}>
            <Search size={16} className="muted" />
            <input value={keyword}
                   onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                   placeholder="Tìm theo tên sản phẩm…" />
          </div>
          {isFetching && !isLoading && <LoaderCircle size={16} className="spin muted" />}
        </div>

        {isLoading && <div className="center-box"><LoaderCircle className="spin" /> Đang tải sản phẩm…</div>}
        {isError && <div className="alert alert-danger" style={{ margin: 16 }}>Không tải được danh sách sản phẩm.</div>}

        {data?.items.length === 0 && (
          <div className="center-box">
            <Inbox size={44} />
            <div>{keyword.trim() ? "Không tìm thấy sản phẩm phù hợp." : "Chưa có sản phẩm nào trong mục này."}</div>
            {tab === "ACTIVE" && !keyword.trim() && (
              <Link to="/seller/products/new" className="btn btn-primary" style={{ marginTop: 12 }}>
                <PackagePlus size={16} /> Tạo sản phẩm đầu tiên
              </Link>
            )}
          </div>
        )}

        {data?.items.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Giá bán</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-main">
                          <ProductThumb product={p} />
                          <div>
                            <strong>{p.name}</strong>
                            <div className="cell-sub">
                              #{p.id} · {(p.variants ?? []).length} biến thể · {(p.images ?? []).length} ảnh
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{p.categoryName || "—"}</td>
                      <td>{priceRange(p)}</td>
                      <td>{totalStock(p)}</td>
                      <td>
                        <span className={`badge ${p.status === "ACTIVE" ? "badge-success" : "badge-muted"}`}>
                          {p.status === "ACTIVE" ? "Đang bán" : "Đã xoá"}
                        </span>
                      </td>
                      <td>{formatDate(p.createdAt)}</td>
                      <td>
                        <div className="actions">
                          <Link to="/seller/products/$productId" params={{ productId: String(p.id) }}
                                className="btn btn-sm btn-ghost" title="Sửa sản phẩm">
                            <Pencil size={15} />
                          </Link>
                          {p.status === "ACTIVE" && (
                            <button className="btn-sm btn-danger" title="Xoá sản phẩm"
                                    onClick={() => setDeleting(p)}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination" style={{ padding: "0 16px 16px" }}>
              <button className="btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={16} /> Trước
              </button>
              <span className="muted">
                Trang {data.page} / {Math.max(1, data.totalPages)} · {data.totalItems} sản phẩm
              </span>
              <button className="btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                Sau <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </section>

      {deleting && (
        <DeleteProductModal
          product={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => { if (data?.items.length === 1 && page > 1) setPage(page - 1); }}
        />
      )}
    </div>
  );
}
