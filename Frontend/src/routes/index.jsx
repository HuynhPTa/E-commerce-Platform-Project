import { Link } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, Sparkles, Store } from "lucide-react";
import { useCategoryTree } from "../queries/useCategories";
import { useProductsQuery } from "../queries/useProducts";
import CategoryIcon from "../components/category/CategoryIcon";
import ProductCard from "../components/product/ProductCard";

export default function HomePage() {
  const { data: tree = [], isLoading } = useCategoryTree();
  const {
    data: recommended,
    isLoading: isRecommendedLoading,
    isError: isRecommendedError,
  } = useProductsQuery({ sort: "best_selling", page: 1, size: 8 });
  const recommendedItems = recommended?.items ?? [];

  return (
    <div>
      <section className="hero">
        <div>
          <h1>Siêu sale 10.10</h1>
          <p>Hàng triệu sản phẩm chính hãng từ các shop uy tín trên MarketHub.</p>
          <Link to="/products" className="btn">Mua ngay <ArrowRight size={16} /></Link>
        </div>
        <Link to="/seller/register" className="btn btn-outline" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.7)" }}>
          <Store size={16} /> Mở shop miễn phí
        </Link>
      </section>

      <section className="card">
        <div className="card-header">
          <h3 className="row"><LayoutGrid size={18} color="var(--primary)" /> Danh mục</h3>
          <Link to="/products" className="muted">Xem tất cả sản phẩm <ArrowRight size={14} style={{ verticalAlign: "middle" }} /></Link>
        </div>
        {isLoading ? <div className="center-box">Đang tải danh mục…</div> : (
          <div className="cat-grid">
            {tree.map((c) => (
              <Link key={c.id} to="/products" search={{ category: c.slug }}>
                <span className="cat-circle"><CategoryIcon name={c.icon} size={26} /></span>
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card home-products">
        <div className="card-header">
          <h3 className="row"><Sparkles size={18} color="var(--primary)" /> Sản phẩm đề xuất</h3>
          <Link to="/products" search={{ sort: "best_selling" }} className="muted">
            Xem tất cả sản phẩm <ArrowRight size={14} style={{ verticalAlign: "middle" }} />
          </Link>
        </div>
        {isRecommendedLoading && <div className="center-box">Đang tải sản phẩm…</div>}
        {isRecommendedError && (
          <div className="card-body">
            <p role="alert">Không tải được sản phẩm đề xuất.</p>
          </div>
        )}
        {!isRecommendedLoading && !isRecommendedError && (
          recommendedItems.length > 0 ? (
            <div className="card-body">
              <div className="product-grid">
                {recommendedItems.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : (
            <div className="card-body muted">Chưa có sản phẩm để đề xuất.</div>
          )
        )}
      </section>
    </div>
  );
}
