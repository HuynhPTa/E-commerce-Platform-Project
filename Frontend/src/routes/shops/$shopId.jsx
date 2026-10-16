import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Package, CalendarDays, User, Store, LoaderCircle, PackageOpen, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useShop } from "../../queries/useShops";
import { useProductsQuery } from "../../queries/useProducts";
import ProductCard from "../../components/product/ProductCard";
import ShopStatusBadge from "../../components/shop/ShopStatusBadge";
import { formatDate } from "../../lib/errors";

const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "best_selling", label: "Bán chạy" },
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
];

function ShopProducts({ shopId }) {
  const search = useSearch({ from: "/shops/$shopId" });
  const navigate = useNavigate({ from: "/shops/$shopId" });
  const { data, isLoading, isError, isFetching } = useProductsQuery({ shop: shopId, sort: search.sort, page: search.page, size: 20 });

  const setSearch = (patch) => navigate({ search: (prev) => ({ ...prev, ...patch }) });

  return (
    <section>
      <div className="toolbar">
        <span className="muted">Sắp xếp theo</span>
        {SORTS.map((s) => (
          <button key={s.value} className={`btn-sm ${search.sort === s.value ? "btn-primary" : ""}`}
                  onClick={() => setSearch({ sort: s.value, page: 1 })}>
            {s.label}
          </button>
        ))}
        <span className="spacer" />
        {isFetching && !isLoading && <LoaderCircle size={16} className="spin muted" />}
      </div>

      {isLoading && <div className="center-box"><LoaderCircle className="spin" /> Đang tải sản phẩm…</div>}
      {isError && <div className="alert alert-danger">Không tải được sản phẩm của shop.</div>}
      {data && data.items.length === 0 && (
        <div className="card center-box"><PackageOpen size={48} /> Shop chưa có sản phẩm nào.</div>
      )}
      {data && data.items.length > 0 && (
        <>
          <div className="product-grid">
            {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {data.totalPages > 1 && (
            <div className="pagination">
              <button className="btn-sm" disabled={search.page <= 1} onClick={() => setSearch({ page: search.page - 1 })}>
                <ChevronLeft size={16} /> Trước
              </button>
              <span>Trang {search.page} / {data.totalPages}</span>
              <button className="btn-sm" disabled={search.page >= data.totalPages} onClick={() => setSearch({ page: search.page + 1 })}>
                Sau <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function ShopPage() {
  const { shopId } = useParams({ from: "/shops/$shopId" });
  const { data: shop, isLoading, isError } = useShop(shopId);

  if (isLoading) return <div className="center-box"><LoaderCircle className="spin" /> Đang tải shop…</div>;
  if (isError || !shop) {
    return (
      <div className="card center-box">
        <Store size={48} />
        <h2 style={{ color: "var(--text)" }}>Không tìm thấy shop</h2>
        <p>Shop không tồn tại hoặc chưa được duyệt.</p>
        <Link to="/products" className="btn btn-primary">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Chủ shop / Admin xem trước khi shop chưa hoạt động */}
      {shop.status !== "APPROVED" && (
        <div className="alert alert-info">
          <Info size={18} />
          <div><strong>Bản xem trước</strong>Shop đang ở trạng thái “{shop.status}”, người mua chưa thấy trang này.</div>
        </div>
      )}

      <div className="card shop-hero">
        <div className="shop-hero-cover">
          {shop.logoUrl ? <img className="logo-thumb" src={shop.logoUrl} alt={shop.name} />
            : <span className="logo-thumb">{shop.name[0]}</span>}
          <div>
            <h1>{shop.name}</h1>
            <ShopStatusBadge status={shop.status} />
          </div>
        </div>
        <div className="shop-stats">
          <div><Package size={16} /> Sản phẩm: <b>{shop.productCount}</b></div>
          <div><CalendarDays size={16} /> Tham gia: <b>{formatDate(shop.createdAt)}</b></div>
          <div><User size={16} /> Chủ shop: <b>{shop.ownerName || "—"}</b></div>
          <div><Store size={16} /> Mã shop: <b>#{shop.id}</b></div>
        </div>
      </div>

      {shop.description && (
        <div className="card card-body" style={{ marginBottom: 16 }}>
          <h3>Giới thiệu shop</h3>
          <p className="muted" style={{ whiteSpace: "pre-line", margin: 0 }}>{shop.description}</p>
        </div>
      )}

      <h2>Tất cả sản phẩm</h2>
      <ShopProducts shopId={shopId} />
    </div>
  );
}
