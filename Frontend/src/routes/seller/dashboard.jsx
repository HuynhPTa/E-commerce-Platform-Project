// File này nằm trong "seller" bundle riêng (lazy import ở router.jsx) — buyer thường không tải về.
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, CalendarDays, CircleCheck, ClipboardList, Clock, ExternalLink, Inbox,
  LoaderCircle, MapPin, Package, Phone, Store, TriangleAlert, Wallet,
} from "lucide-react";
import { useSellerDashboard } from "../../queries/useSeller";
import { useMyShop } from "../../queries/useShops";
import OrderStatusBadge from "../../components/order/OrderStatusBadge";
import { ORDER_STATUS_KEYS, orderStatusMeta } from "../../components/order/orderStatus";
import ShopStatusBadge from "../../components/shop/ShopStatusBadge";
import { formatDate } from "../../lib/errors";
import { formatVnd } from "../../lib/format";
import { assetUrl, onImageError } from "../../lib/assetUrl";

const TONE_COLOR = {
  warning: "var(--warning)",
  info: "var(--info)",
  success: "var(--success)",
  danger: "var(--danger)",
  muted: "#9ca3af",
};

function Stat({ icon: Icon, color, bg, value, label, sub }) {
  return (
    <div className="card stat-card">
      <span className="stat-icon" style={{ background: bg, color }}><Icon size={22} /></span>
      <div>
        <div className="stat-value">{value ?? "—"}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="cell-sub">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBreakdown({ counts, total }) {
  return (
    <div className="status-breakdown">
      {ORDER_STATUS_KEYS.map((status) => {
        const meta = orderStatusMeta(status);
        const count = counts?.[status] ?? 0;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div className="status-breakdown-row" key={status}>
            <span>{meta.label}</span>
            <span className="status-bar">
              <span style={{ width: `${percent}%`, background: TONE_COLOR[meta.tone] }} />
            </span>
            <b>{count}</b>
          </div>
        );
      })}
    </div>
  );
}

export default function SellerDashboard() {
  const { data: shop } = useMyShop(); // đã có trong cache từ SellerLayout
  const { data, isLoading, isError } = useSellerDashboard();

  if (!shop) return null;
  if (isLoading) return <div className="center-box"><LoaderCircle className="spin" /> Đang tải tổng quan…</div>;
  if (isError) {
    return <div className="alert alert-danger"><TriangleAlert size={18} /><div>Không tải được số liệu tổng quan. Vui lòng thử lại.</div></div>;
  }

  return (
    <div>
      <div className="stat-grid">
        <Stat icon={Wallet} color="var(--success)" bg="var(--success-soft)"
              value={formatVnd(data.revenueMinor)} label="Doanh thu đã hoàn tất"
              sub={`Hôm nay: ${formatVnd(data.todayRevenueMinor)}`} />
        <Stat icon={Clock} color="var(--warning)" bg="var(--warning-soft)"
              value={data.pendingOrders} label="Đơn chờ xác nhận"
              sub={`${data.todayOrders} đơn hôm nay`} />
        <Stat icon={ClipboardList} color="var(--primary)" bg="var(--primary-soft)"
              value={data.totalOrders} label="Tổng đơn của shop"
              sub={`${data.completedOrders} hoàn tất · ${data.cancelledOrders} đã huỷ`} />
        <Stat icon={Package} color="#0891b2" bg="#e0f2fe"
              value={data.productCount} label="Sản phẩm đang bán" />
      </div>

      <div className="dashboard-columns">
        <section className="card">
          <div className="card-header">
            <h3>Đơn hàng gần đây</h3>
            <Link to="/seller/orders" className="btn btn-sm btn-outline">Xử lý đơn <ArrowRight size={14} /></Link>
          </div>
          {data.recentOrders?.length === 0 ? (
            <div className="center-box"><Inbox size={40} /> Shop chưa có đơn hàng nào.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Mã đơn</th><th>Người mua</th><th>Tổng</th><th>Trạng thái</th><th>Ngày đặt</th></tr>
                </thead>
                <tbody>
                  {data.recentOrders?.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong><div className="cell-sub">{order.itemCount} món</div></td>
                      <td>{order.buyerName}<div className="cell-sub">{order.buyerEmail}</div></td>
                      <td>{formatVnd(order.totalMinor)}</td>
                      <td><OrderStatusBadge status={order.status} /></td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h3>Đơn theo trạng thái</h3>
            <span className="cell-sub">{data.totalOrders} đơn</span>
          </div>
          <div className="card-body">
            <StatusBreakdown counts={data.ordersByStatus} total={data.totalOrders} />
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>Thông tin shop</h3>
          <div className="row">
            <Link to="/seller/settings" className="btn btn-sm btn-outline">Cài đặt shop</Link>
            <Link to="/shops/$shopId" params={{ shopId: String(shop.id) }} className="btn btn-sm btn-outline">
              <ExternalLink size={14} /> Xem trang shop
            </Link>
          </div>
        </div>
        <div className="card-body stack">
          <div className="cell-main">
            {shop.logoUrl
              ? <img className="logo-thumb" style={{ width: 56, height: 56 }} src={assetUrl(shop.logoUrl)} alt="" onError={onImageError} />
              : <span className="logo-thumb" style={{ width: 56, height: 56, fontSize: 22 }}>{shop.name[0]}</span>}
            <div>
              <strong style={{ fontSize: 16 }}>{shop.name}</strong>
              <div className="cell-sub">Mã shop #{shop.id} · <ShopStatusBadge status={shop.status} /></div>
            </div>
          </div>
          <div className="row"><Phone size={16} className="muted" /> {shop.phone}</div>
          <div className="row"><MapPin size={16} className="muted" /> {shop.pickupAddress}</div>
          {shop.description && <p className="muted" style={{ whiteSpace: "pre-line" }}>{shop.description}</p>}
          <div className="row muted" style={{ fontSize: 12 }}>
            <CircleCheck size={14} /> Duyệt ngày {formatDate(shop.reviewedAt ?? shop.createdAt)}
            <span className="spacer" />
            <Store size={14} /> {shop.productCount} sản phẩm
            <CalendarDays size={14} /> Tham gia {formatDate(shop.createdAt)}
          </div>
        </div>
      </section>
    </div>
  );
}
