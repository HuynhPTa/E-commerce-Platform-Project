import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Eye, Inbox, LoaderCircle, Search, TriangleAlert,
} from "lucide-react";
import {
  useSellerDashboard, useSellerOrderDetail, useSellerOrders, useUpdateSellerOrderStatus,
} from "../../queries/useSeller";
import { useDebounce } from "../../hooks/useDebounce";
import OrderStatusBadge from "../../components/order/OrderStatusBadge";
import {
  ORDER_STATUS_TABS, PAYMENT_METHOD_LABELS, SELLER_ORDER_ACTIONS,
} from "../../components/order/orderStatus";
import OrderDetailModal from "../../components/order/OrderDetailModal";
import { errMsg, formatDate } from "../../lib/errors";
import { formatVnd } from "../../lib/format";

export default function SellerOrdersPage() {
  const [tab, setTab] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const q = useDebounce(keyword.trim(), 400);

  const { data: dashboard } = useSellerDashboard(); // dùng lại cache cho số đếm trên tab
  const { data, isLoading, isError, isFetching } = useSellerOrders({
    status: tab === "ALL" ? undefined : tab,
    q: q || undefined,
    page,
    size: 10,
  });
  const detailQuery = useSellerOrderDetail(detailId);
  const mutation = useUpdateSellerOrderStatus();

  const changeTab = (key) => { setTab(key); setPage(1); };
  const tabCount = (key) => key === "ALL"
    ? dashboard?.totalOrders ?? 0
    : dashboard?.ordersByStatus?.[key] ?? 0;

  const closeDetail = () => {
    setDetailId(null);
    setConfirmStatus(null);
    mutation.reset();
  };

  const updateStatus = (orderId, status) => {
    mutation.mutate({ orderId, status }, {
      onSuccess: () => setConfirmStatus(null),
    });
  };

  const order = detailQuery.data;
  const actions = order ? (SELLER_ORDER_ACTIONS[order.status] ?? []) : [];
  const footer = order ? (
    confirmStatus ? (
      <>
        <span className="muted" style={{ marginRight: "auto" }}>
          Huỷ đơn #{order.id}? Hàng sẽ được hoàn lại kho.
        </span>
        <button onClick={() => setConfirmStatus(null)} disabled={mutation.isPending}>Không</button>
        <button className="btn-danger" disabled={mutation.isPending}
                onClick={() => updateStatus(order.id, confirmStatus)}>
          {mutation.isPending ? <LoaderCircle size={16} className="spin" /> : null} Xác nhận huỷ
        </button>
      </>
    ) : (
      <>
        <button className="btn" onClick={closeDetail}>Đóng</button>
        {actions.map((action) => (
          <button key={action.status} className={action.className} disabled={mutation.isPending}
                  onClick={() => action.confirm
                    ? setConfirmStatus(action.status)
                    : updateStatus(order.id, action.status)}>
            {action.label}
          </button>
        ))}
      </>
    )
  ) : <button className="btn" onClick={closeDetail}>Đóng</button>;

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
                 placeholder="Tìm theo mã đơn, email hoặc tên người mua…" />
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
                  <th>Mã đơn</th><th>Người mua</th><th>Số món</th><th>Tổng tiền</th>
                  <th>Thanh toán</th><th>Trạng thái</th><th>Ngày đặt</th>
                  <th style={{ textAlign: "right" }}>Xử lý</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>#{item.id}</strong></td>
                    <td>{item.buyerName}<div className="cell-sub">{item.buyerEmail}</div></td>
                    <td>{item.itemCount}</td>
                    <td><strong>{formatVnd(item.totalMinor)}</strong></td>
                    <td>{PAYMENT_METHOD_LABELS[item.paymentMethod] ?? item.paymentMethod}</td>
                    <td><OrderStatusBadge status={item.status} /></td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn-sm btn-ghost" title="Xem và xử lý đơn"
                                onClick={() => { mutation.reset(); setDetailId(item.id); }}>
                          <Eye size={15} /> Chi tiết
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
          order={order}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          error={detailQuery.error}
          onClose={closeDetail}
          footer={footer}
          notice={mutation.isError && (
            <div className="alert alert-danger">
              <TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div>
            </div>
          )}
        />
      )}
    </section>
  );
}
