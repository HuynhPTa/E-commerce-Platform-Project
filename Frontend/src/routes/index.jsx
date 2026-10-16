import { Link } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, Store } from "lucide-react";
import { useCategoryTree } from "../queries/useCategories";
import CategoryIcon from "../components/category/CategoryIcon";

export default function HomePage() {
  const { data: tree = [], isLoading } = useCategoryTree();

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
    </div>
  );
}
