import { Link, useParams } from "@tanstack/react-router";
import { ChevronLeft, ImageOff, LoaderCircle, MapPin, Phone, Store, TriangleAlert, User } from "lucide-react";
import { useMyOrderDetail } from "../../queries/useOrders";
import OrderStatusBadge from "../../components/order/OrderStatusBadge";
import OrderTimeline from "../../components/order/OrderTimeline";
import { PAYMENT_METHOD_LABELS } from "../../components/order/orderStatus";
import { errMsg, formatDate } from "../../lib/errors";
import { formatVnd } from "../../lib/format";
import { assetUrl, onImageError } from "../../lib/assetUrl";

// F15: chi tiết đơn của người mua + Order Timeline
export default function MyOrderDetailPage() {
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const { data: order, isLoading, isError, error } = useMyOrderDetail(orderId);

  const back = (
    <Link to="/orders" className="row" style={{ marginBottom: 12 }}>
      <ChevronLeft size={16} /> Đơn mua của tôi
    </Link>
  );

  if (isLoading) return <div className="center-box"><LoaderCircle className="spin" /> Đang tải đơn hàng…</div>;
  if (isError || !order) {
    return (
      <div>
        {back}
        <div className="alert alert-danger"><TriangleAlert size={18} /><span>{errMsg(error, "Không tìm thấy đơn hàng.")}</span></div>
      </div>
    );
  }

  return (
    <div>
      {back}
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Đơn #{order.id}</h1>
          <div className="cell-sub">Đặt ngày {formatDate(order.createdAt)} · Thanh toán {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3>Tiến trình đơn hàng</h3></div>
        <div className="card-body">
          <OrderTimeline status={order.status} history={order.statusHistory} />
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="card">
          <div className="card-header">
            <h3 className="row"><Store size={16} /> {order.shopName || `Shop #${order.shopId}`}</h3>
            <Link to="/shops/$shopId" params={{ shopId: String(order.shopId) }} className="btn btn-sm btn-outline">Xem shop</Link>
          </div>
          <div className="card-body">
            <ul className="order-items">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="order-item">
                  {item.thumbnailUrl
                    ? <img src={assetUrl(item.thumbnailUrl)} alt="" onError={onImageError} />
                    : <span className="order-item__thumb"><ImageOff size={18} /></span>}
                  <div>
                    {item.productId
                      ? <Link to="/products/$productId" params={{ productId: String(item.productId) }}>{item.productName}</Link>
                      : item.productName}
                    <small>
                      {formatVnd(item.unitPriceMinor)} × {item.quantity}
                      {Object.entries(item.attributes ?? {}).length > 0
                        && ` · ${Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}`}
                    </small>
                  </div>
                  <span className="order-item__total">{formatVnd(item.subtotalMinor)}</span>
                </li>
              ))}
            </ul>
            <div className="order-totals">
              <div><span className="muted">Tạm tính</span><span>{formatVnd(order.subtotalMinor)}</span></div>
              <div><span className="muted">Phí vận chuyển</span><span>{formatVnd(order.shippingFeeMinor)}</span></div>
              <div className="grand"><span>Tổng cộng</span><strong>{formatVnd(order.totalMinor)}</strong></div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header"><h3>Địa chỉ nhận hàng</h3></div>
          <div className="card-body stack" style={{ gap: 8 }}>
            <div className="row"><User size={15} className="muted" /> {order.shippingAddress?.recipientName || "—"}</div>
            <div className="row"><Phone size={15} className="muted" /> {order.shippingAddress?.phone || "—"}</div>
            <div className="row"><MapPin size={15} className="muted" /> {order.shippingAddress?.fullAddress || "—"}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
