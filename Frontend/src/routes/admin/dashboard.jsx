// File này nằm trong "admin" bundle riêng — chỉ tải khi user thật sự vào /admin.
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, CalendarDays, CircleCheck, ClipboardList, Clock, FolderTree, Inbox,
  LoaderCircle, Package, Store, TriangleAlert, Users, Wallet,
} from "lucide-react";
import { useAdminDashboard } from "../../queries/useAdmin";
import { useAdminShops } from "../../queries/useShops";
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

export default function AdminDashboard() {
  const { data, isLoading, isError } = useAdminDashboard();
  const { data: pending } = useAdminShops({ status: "PENDING", page: 1, size: 5 });

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
        <Stat icon={CalendarDays} color="var(--info)" bg="var(--info-soft)"
              value={data.todayOrders} label="Đơn hôm nay" sub={`Tổng ${data.totalOrders} đơn`} />
        <Stat icon={ClipboardList} color="var(--primary)" bg="var(--primary-soft)"
              value={data.pendingOrders} label="Đơn chờ xác nhận"
              sub={`${data.completedOrders} hoàn tất · ${data.cancelledOrders} đã huỷ`} />
        <Stat icon={Users} color="#7c3aed" bg="#f3e8ff"
              value={data.totalUsers} label="Người dùng"
              sub={`${data.activeUsers} đang hoạt động`} />
        <Stat icon={Clock} color="var(--warning)" bg="var(--warning-soft)"
              value={data.pendingShops} label="Shop chờ duyệt" sub={`Tổng ${data.totalShops} shop`} />
        <Stat icon={Package} color="#0891b2" bg="#e0f2fe"
              value={data.totalProducts} label="Sản phẩm trên sàn" />
      </div>

      <div className="dashboard-columns">
        <section className="card">
          <div className="card-header">
            <h3>Đơn hàng gần đây</h3>
            <Link to="/admin/orders" className="btn btn-sm btn-outline">Xem tất cả <ArrowRight size={14} /></Link>
          </div>
          {data.recentOrders?.length === 0 ? (
            <div className="center-box"><Inbox size={40} /> Chưa có đơn hàng nào.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Mã đơn</th><th>Shop</th><th>Người mua</th><th>Tổng</th><th>Trạng thái</th></tr>
                </thead>
                <tbody>
                  {data.recentOrders?.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong><div className="cell-sub">{formatDate(order.createdAt)}</div></td>
                      <td>{order.shopName || `#${order.shopId}`}</td>
                      <td>{order.buyerName}<div className="cell-sub">{order.buyerEmail}</div></td>
                      <td>{formatVnd(order.totalMinor)}</td>
                      <td><OrderStatusBadge status={order.status} /></td>
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
          <h3>Shop mới chờ duyệt</h3>
          <Link to="/admin/shops" className="btn btn-sm btn-outline">Xem tất cả <ArrowRight size={14} /></Link>
        </div>
        {pending?.items.length === 0 ? (
          <div className="center-box"><CircleCheck size={40} /> Không có shop nào đang chờ duyệt.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Shop</th><th>Chủ shop</th><th>Ngày gửi</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {pending?.items.map((s) => (
                  <tr key={s.id}>
                    <td><div className="cell-main">
                      {s.logoUrl
                        ? <img className="logo-thumb" src={assetUrl(s.logoUrl)} alt="" onError={onImageError} />
                        : <span className="logo-thumb">{s.name[0]}</span>}
                      <strong>{s.name}</strong>
                    </div></td>
                    <td>{s.ownerName}<div className="cell-sub">{s.ownerEmail}</div></td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td><ShopStatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="row muted" style={{ marginTop: 16, fontSize: 12 }}>
        <FolderTree size={14} /> Doanh thu chỉ tính các đơn ở trạng thái Hoàn tất.
        <span className="spacer" />
        <Store size={14} /> Duyệt shop mới để người bán bắt đầu đăng sản phẩm.
      </div>
    </div>
  );
}
