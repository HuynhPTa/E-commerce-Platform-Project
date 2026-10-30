import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Inbox, LoaderCircle, Store, TriangleAlert } from "lucide-react";
import { useMyOrders, useMyOrderStatusCounts } from "../../queries/useOrders";
import OrderStatusBadge from "../../components/order/OrderStatusBadge";
import { ORDER_STATUS_TABS } from "../../components/order/orderStatus";
import { errMsg, formatDate } from "../../lib/errors";
import { formatVnd } from "../../lib/format";

// F15: lịch sử đơn hàng của người mua. Tab và trang nằm trên URL (?status=SHIPPING&page=2)
export default function MyOrdersPage() {
  const search = useSearch({ from: "/orders" });
  const navigate = useNavigate({ from: "/orders" });
  const { data, isLoading, isError, error, isFetching } = useMyOrders({
    status: search.status === "ALL" ? undefined : search.status,
    page: search.page,
    size: 10,
  });
  const { data: counts } = useMyOrderStatusCounts();

  const setSearch = (patch) => navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const total = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : null;
  const tabCount = (key) => (key === "ALL" ? total : counts?.[key] ?? 0);

  return (
    <div>
      <h1>Đơn mua của tôi</h1>
      <section className="card">
        <div className="tabs">
          {ORDER_STATUS_TABS.map((tab) => (
            <button key={tab.key} className={search.status === tab.key ? "active" : ""}
                    onClick={() => setSearch({ status: tab.key, page: 1 })}>
              {tab.label} {tabCount(tab.key) != null && <span className="count">{tabCount(tab.key)}</span>}
            </button>
          ))}
          {isFetching && !isLoading && <LoaderCircle size={16} className="spin muted" style={{ alignSelf: "center" }} />}
        </div>

        {isLoading && <div className="center-box"><LoaderCircle className="spin" /> Đang tải đơn hàng…</div>}
        {isError && (
          <div className="card-body">
            <div className="alert alert-danger"><TriangleAlert size={18} /><span>{errMsg(error, "Không tải được danh sách đơn hàng.")}</span></div>
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="center-box">
            <Inbox size={44} />
            <span>Chưa có đơn hàng nào{search.status !== "ALL" ? " ở trạng thái này" : ""}.</span>
            <Link to="/products" className="btn btn-primary">Tiếp tục mua sắm</Link>
          </div>
        )}

        {data && data.items.length > 0 && (
          <ul className="my-orders">
            {data.items.map((order) => (
              <li key={order.id} className="my-order">
                <div className="my-order__head">
                  <span className="row"><Store size={16} className="muted" /> <strong>{order.shopName || `Shop #${order.shopId}`}</strong></span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="my-order__body">
                  <div>
                    <div>Đơn <strong>#{order.id}</strong> · {order.itemCount} sản phẩm</div>
                    <div className="cell-sub">Đặt ngày {formatDate(order.createdAt)}</div>
                  </div>
                  <div className="my-order__total">
                    <span className="muted">Thành tiền</span>
                    <strong>{formatVnd(order.totalMinor)}</strong>
                  </div>
                  <Link to="/orders/$orderId" params={{ orderId: String(order.id) }} className="btn btn-sm btn-outline">
                    Xem chi tiết <ArrowRight size={14} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <div className="pagination" style={{ padding: "0 16px 16px" }}>
            <button className="btn-sm" disabled={search.page <= 1} onClick={() => setSearch({ page: search.page - 1 })}>
              <ChevronLeft size={16} /> Trước
            </button>
            <span>Trang {search.page} / {data.totalPages}</span>
            <button className="btn-sm" disabled={search.page >= data.totalPages} onClick={() => setSearch({ page: search.page + 1 })}>
              Sau <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
