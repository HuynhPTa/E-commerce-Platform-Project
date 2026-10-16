// File này nằm trong "seller" bundle riêng (lazy import ở router.jsx) — buyer thường không tải về.
import { Link } from "@tanstack/react-router";
import { Package, CalendarDays, CircleCheck, ExternalLink, Phone, MapPin } from "lucide-react";
import { useMyShop } from "../../queries/useShops";
import ShopStatusBadge from "../../components/shop/ShopStatusBadge";
import { formatDate } from "../../lib/errors";

export default function SellerDashboard() {
  const { data: shop } = useMyShop(); // đã có trong cache từ SellerLayout
  if (!shop) return null;

  return (
    <div>
      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-icon" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}><Package size={22} /></span>
          <div><div className="stat-value">{shop.productCount}</div><div className="stat-label">Sản phẩm đang bán</div></div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><CircleCheck size={22} /></span>
          <div><div className="stat-value" style={{ fontSize: 16 }}><ShopStatusBadge status={shop.status} /></div><div className="stat-label">Trạng thái shop</div></div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon" style={{ background: "var(--info-soft)", color: "var(--info)" }}><CalendarDays size={22} /></span>
          <div><div className="stat-value" style={{ fontSize: 18 }}>{formatDate(shop.reviewedAt ?? shop.createdAt)}</div><div className="stat-label">Ngày được duyệt</div></div>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <h3>Thông tin shop</h3>
          <Link to="/shops/$shopId" params={{ shopId: String(shop.id) }} className="btn btn-sm btn-outline">
            <ExternalLink size={14} /> Xem trang shop
          </Link>
        </div>
        <div className="card-body stack">
          <div className="cell-main">
            {shop.logoUrl ? <img className="logo-thumb" style={{ width: 56, height: 56 }} src={shop.logoUrl} alt="" />
              : <span className="logo-thumb" style={{ width: 56, height: 56, fontSize: 22 }}>{shop.name[0]}</span>}
            <div><strong style={{ fontSize: 16 }}>{shop.name}</strong><div className="cell-sub">Mã shop #{shop.id}</div></div>
          </div>
          <div className="row"><Phone size={16} className="muted" /> {shop.phone}</div>
          <div className="row"><MapPin size={16} className="muted" /> {shop.pickupAddress}</div>
          {shop.description && <p className="muted" style={{ whiteSpace: "pre-line" }}>{shop.description}</p>}
        </div>
      </section>
    </div>
  );
}
