import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Eye, Inbox, LoaderCircle, Search, TriangleAlert,
} from "lucide-react";
import { useAdminDashboard, useAdminOrderDetail, useAdminOrders } from "../../queries/useAdmin";
import { useDebounce } from "../../hooks/useDebounce";
import OrderStatusBadge from "../../components/order/OrderStatusBadge";
import { ORDER_STATUS_TABS, PAYMENT_METHOD_LABELS } from "../../components/order/orderStatus";
import OrderDetailModal from "../../components/order/OrderDetailModal";
import { formatDate } from "../../lib/errors";
import { formatVnd } from "../../lib/format";

export default function AdminOrdersPage() {
  const [tab, setTab] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const q = useDebounce(keyword.trim(), 400);

  const { data: dashboard } = useAdminDashboard(); // dùng lại cache cho số đếm trên tab
  const { data, isLoading, isError, isFetching } = useAdminOrders({
    status: tab === "ALL" ? undefined : tab,
    q: q || undefined,
    page,
    size: 10,
  });
  const detailQuery = useAdminOrderDetail(detailId);

  const changeTab = (key) => { setTab(key); setPage(1); };
  const tabCount = (key) => key === "ALL"
    ? dashboard?.totalOrders ?? 0
    : dashboard?.ordersByStatus?.[key] ?? 0;

  return (
    <section className="card">
      <div className="tabs">
        {ORDER_STATUS_TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => changeTab(t.key)}>
            {t.label} <span className="count">{tabCount(t.key)}</span>
          </button>
        ))}
      </div>

      <div className="card-header">
        <div className="row" style={{ flex: 1, maxWidth: 420 }}>
          <Search size={16} className="muted" />
          <input value={keyword}
                 onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                 placeholder="Tìm theo mã đơn, email/người mua hoặc tên shop…" />
        </div>
        {isFetching && !isLoading && <LoaderCircle size={16} className="spin muted" />}
      </div>

      {isLoading && <div className="center-box"><LoaderCircle className="spin" /> Đang tải đơn hàng…</div>}
      {isError && (
        <div className="alert alert-danger" style={{ margin: 16 }}>
          <TriangleAlert size={18} /><div>Không tải được danh sách đơn hàng.</div>
        </div>
      )}
      {data?.items.length === 0 && (
        <div className="center-box"><Inbox size={44} /> Không có đơn hàng phù hợp.</div>
      )}

      {data?.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn</th><th>Shop</th><th>Người mua</th><th>Số món</th>
                  <th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày đặt</th>
                  <th style={{ textAlign: "right" }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>{order.shopName || `#${order.shopId}`}</td>
                    <td>{order.buyerName}<div className="cell-sub">{order.buyerEmail}</div></td>
                    <td>{order.itemCount}</td>
                    <td><strong>{formatVnd(order.totalMinor)}</strong></td>
                    <td>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn-sm btn-ghost" title="Xem chi tiết" onClick={() => setDetailId(order.id)}>
                          <Eye size={15} />
                        </button>
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
            <span className="muted">Trang {data.page} / {Math.max(1, data.totalPages)} · {data.totalItems} đơn</span>
            <button className="btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {detailId != null && (
        <OrderDetailModal
          order={detailQuery.data}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          error={detailQuery.error}
          onClose={() => setDetailId(null)}
          footer={<button className="btn" onClick={() => setDetailId(null)}>Đóng</button>}
        />
      )}
    </section>
  );
}
