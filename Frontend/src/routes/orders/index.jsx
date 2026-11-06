import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft, ChevronRight, CreditCard, Inbox, LoaderCircle, Package, Store, TriangleAlert,
} from "lucide-react";
import { useMyOrders } from "../../queries/useOrders";
import OrderStatusBadge from "../../components/order/OrderStatusBadge";
import { ORDER_STATUS_TABS, PAYMENT_METHOD_LABELS } from "../../components/order/orderStatus";
import { errMsg, formatDate } from "../../lib/errors";
import { formatVnd } from "../../lib/format";

export default function OrdersPage() {
  const [tab, setTab] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useMyOrders({
    status: tab === "ALL" ? undefined : tab,
    page,
    size: 10,
  });

  const changeTab = (key) => {
    setTab(key);
    setPage(1);
  };

  return (
    <div className="orders-page">
      <div className="page-title">
        <h1>Đơn hàng của tôi</h1>
        {isFetching && !isLoading && <LoaderCircle size={16} className="spin muted" />}
      </div>

      <section className="card">
        <div className="tabs">
          {ORDER_STATUS_TABS.map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? "active" : ""}
              onClick={() => changeTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="center-box"><LoaderCircle className="spin" /> Đang tải đơn hàng…</div>
        )}

        {isError && (
          <div className="alert alert-danger" style={{ margin: 16 }}>
            <TriangleAlert size={18} />
            <div>{errMsg(error, "Không tải được danh sách đơn hàng.")}</div>
          </div>
        )}

        {data?.items.length === 0 && (
          <div className="center-box">
            <Inbox size={44} />
            <div>Bạn chưa có đơn hàng nào ở trạng thái này.</div>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: 12 }}>
              Tiếp tục mua sắm
            </Link>
          </div>
        )}

        {data?.items.length > 0 && (
          <>
            <ul className="order-cards">
              {data.items.map((order) => (
                <li key={order.id} className="order-card">
                  <div className="order-card__head">
                    <div>
                      <strong>Đơn #{order.id}</strong>
                      <span className="muted"> · {formatDate(order.createdAt)}</span>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="order-card__meta">
                    <span><Store size={14} /> {order.shopName || `Shop #${order.shopId}`}</span>
                    <span><Package size={14} /> {order.itemCount} sản phẩm</span>
                    <span>
                      <CreditCard size={14} />{" "}
                      {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                  </div>

                  <div className="order-card__foot">
                    <span className="muted">Tổng cộng</span>
                    <strong className="order-card__total">{formatVnd(order.totalMinor)}</strong>
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: String(order.id) }}
                      className="btn btn-sm btn-outline"
                    >
                      Xem chi tiết <ChevronRight size={14} />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pagination" style={{ padding: "0 16px 16px" }}>
              <button className="btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={16} /> Trước
              </button>
              <span className="muted">
                Trang {data.page} / {Math.max(1, data.totalPages)} · {data.totalItems} đơn
              </span>
              <button
                className="btn-sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
