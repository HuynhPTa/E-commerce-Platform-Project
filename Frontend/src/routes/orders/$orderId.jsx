import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft, CreditCard, ImageOff, LoaderCircle, MapPin, Phone, RefreshCw, Store,
  TriangleAlert, User,
} from "lucide-react";
import { useMyOrderDetail } from "../../queries/useOrders";
import OrderStatusBadge from "../../components/order/OrderStatusBadge";
import OrderTimeline from "../../components/order/OrderTimeline";
import { PAYMENT_METHOD_LABELS } from "../../components/order/orderStatus";
import { errMsg, formatDate } from "../../lib/errors";
import { formatVnd } from "../../lib/format";
import { assetUrl, onImageError } from "../../lib/assetUrl";

const PAYMENT_STATUS = {
  PENDING: { label: "Chưa thanh toán", tone: "warning" },
  SUCCEEDED: { label: "Đã thanh toán", tone: "success" },
  FAILED: { label: "Thanh toán thất bại", tone: "danger" },
};

const attributeText = (attributes) =>
  Object.entries(attributes ?? {}).map(([key, value]) => `${key}: ${value}`).join(", ");

export default function OrderDetailPage() {
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const id = Number(orderId);
  const { data: order, isLoading, isError, error, refetch, isFetching } = useMyOrderDetail(id);

  if (isLoading) {
    return <div className="center-box"><LoaderCircle className="spin" /> Đang tải chi tiết đơn hàng…</div>;
  }

  if (isError || !order) {
    return (
      <div className="card card-body">
        <div className="alert alert-danger" role="alert">
          <TriangleAlert size={18} />
          <div>{errMsg(error, "Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này.")}</div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={16} /> Thử lại
          </button>
          <Link to="/orders" className="btn">Về danh sách đơn hàng</Link>
        </div>
      </div>
    );
  }

  const payment = PAYMENT_STATUS[order.paymentStatus]
    ?? { label: "Chưa thanh toán", tone: "warning" };
  const canPay = order.status === "PENDING" && order.paymentStatus !== "SUCCEEDED";

  return (
    <div className="order-detail">
      <div className="breadcrumb">
        <Link to="/orders"><ArrowLeft size={14} /> Đơn hàng của tôi</Link>
        <span>/</span>
        <span>Đơn #{order.id}</span>
      </div>

      <section className="card card-body">
        <div className="order-detail__head">
          <div>
            <h1>Đơn hàng #{order.id}</h1>
            <p className="muted">Đặt lúc {formatDate(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <OrderTimeline
          status={order.status}
          createdAt={order.createdAt}
          updatedAt={order.updatedAt}
        />
      </section>

      <div className="order-detail__grid">
        <section className="card card-body">
          <h2>Sản phẩm ({order.items?.length ?? 0})</h2>
          <ul className="order-items">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="order-item">
                {item.thumbnailUrl ? (
                  <img src={assetUrl(item.thumbnailUrl)} alt="" onError={onImageError} />
                ) : (
                  <span className="order-item__thumb"><ImageOff size={18} /></span>
                )}
                <div>
                  <div>{item.productName}</div>
                  <small>
                    {formatVnd(item.unitPriceMinor)} × {item.quantity}
                    {attributeText(item.attributes) && ` · ${attributeText(item.attributes)}`}
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
        </section>

        <aside className="stack">
          <section className="card card-body">
            <h2>Người bán</h2>
            <div className="row"><Store size={15} className="muted" /> {order.shopName || `Shop #${order.shopId}`}</div>
          </section>

          <section className="card card-body">
            <h2>Địa chỉ nhận hàng</h2>
            <div className="stack" style={{ gap: 6 }}>
              <div className="row"><User size={15} className="muted" /> {order.shippingAddress?.recipientName || "—"}</div>
              <div className="row"><Phone size={15} className="muted" /> {order.shippingAddress?.phone || "—"}</div>
              <div className="row"><MapPin size={15} className="muted" /> {order.shippingAddress?.fullAddress || "—"}</div>
            </div>
          </section>

          <section className="card card-body">
            <h2>Thanh toán</h2>
            <div className="stack" style={{ gap: 8 }}>
              <div className="row">
                <CreditCard size={15} className="muted" />
                {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </div>
              <div className="row">
                <span className="muted">Trạng thái</span>
                <span className={`badge badge-${payment.tone}`}>{payment.label}</span>
              </div>
            </div>

            {canPay && (
              <Link
                to="/checkout/result"
                search={{ checkoutId: order.checkoutSessionId }}
                className="btn btn-primary btn-block"
                style={{ marginTop: 12 }}
              >
                Thanh toán ngay
              </Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
