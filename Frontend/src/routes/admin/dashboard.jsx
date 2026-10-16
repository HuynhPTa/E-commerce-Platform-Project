// File này nằm trong "admin" bundle riêng — chỉ tải khi user thật sự vào /admin.
import { Link } from "@tanstack/react-router";
import { Clock, CircleCheck, Lock, FolderTree, ArrowRight, Inbox } from "lucide-react";
import { useAdminShopSummary, useAdminShops } from "../../queries/useShops";
import { useCategoryFlat } from "../../queries/useCategories";
import ShopStatusBadge from "../../components/shop/ShopStatusBadge";
import { formatDate } from "../../lib/errors";

function Stat({ icon: Icon, color, bg, value, label }) {
  return (
    <div className="card stat-card">
      <span className="stat-icon" style={{ background: bg, color }}><Icon size={22} /></span>
      <div>
        <div className="stat-value">{value ?? "—"}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: summary } = useAdminShopSummary();
  const { data: categories } = useCategoryFlat();
  const { data: pending } = useAdminShops({ status: "PENDING", page: 1, size: 5 });

  return (
    <div>
      <div className="stat-grid">
        <Stat icon={Clock} color="var(--warning)" bg="var(--warning-soft)" value={summary?.PENDING} label="Shop chờ duyệt" />
        <Stat icon={CircleCheck} color="var(--success)" bg="var(--success-soft)" value={summary?.APPROVED} label="Shop đang hoạt động" />
        <Stat icon={Lock} color="#4b5563" bg="#eef0f3" value={summary?.SUSPENDED} label="Shop bị khoá" />
        <Stat icon={FolderTree} color="var(--primary)" bg="var(--primary-soft)" value={categories?.length} label="Danh mục sản phẩm" />
      </div>

      <section className="card">
        <div className="card-header">
          <h3>Shop mới chờ duyệt</h3>
          <Link to="/admin/shops" className="btn btn-sm btn-outline">Xem tất cả <ArrowRight size={14} /></Link>
        </div>
        {pending?.items.length === 0 ? (
          <div className="center-box"><Inbox size={40} /> Không có shop nào đang chờ duyệt.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Shop</th><th>Chủ shop</th><th>Ngày gửi</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {pending?.items.map((s) => (
                  <tr key={s.id}>
                    <td><div className="cell-main">
                      {s.logoUrl ? <img className="logo-thumb" src={s.logoUrl} alt="" /> : <span className="logo-thumb">{s.name[0]}</span>}
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
    </div>
  );
}
