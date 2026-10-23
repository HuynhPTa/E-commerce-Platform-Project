import { ImageOff, LoaderCircle, MapPin, Phone, Store, User } from "lucide-react";
import Modal from "../common/Modal";
import OrderStatusBadge from "./OrderStatusBadge";
import { PAYMENT_METHOD_LABELS } from "./orderStatus";
import { errMsg, formatDate } from "../../lib/errors";
import { formatVnd } from "../../lib/format";
import { assetUrl, onImageError } from "../../lib/assetUrl";

// Component chỉ nhận dữ liệu qua props; việc gọi API chi tiết do trang Admin/Seller tự làm.
export default function OrderDetailModal({
  order, isLoading, isError, error, onClose, footer, notice, title = "Chi tiết đơn hàng",
}) {
  return (
    <Modal title={title} onClose={onClose} width={680} footer={footer}>
      {notice}
      {isLoading && <div className="center-box"><LoaderCircle className="spin" /> Đang tải chi tiết đơn…</div>}
      {isError && (
        <div className="alert alert-danger">
          <span>{errMsg(error, "Không tải được chi tiết đơn hàng.")}</span>
        </div>
      )}

      {order && (
        <>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0 }}>Đơn #{order.id}</h3>
              <div className="cell-sub">Đặt lúc {formatDate(order.createdAt)}</div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <dl className="order-detail-meta">
            <div><dt>Người mua</dt><dd>{order.buyerName}</dd></div>
            <div><dt>Email</dt><dd>{order.buyerEmail}</dd></div>
            <div><dt>Shop</dt><dd>{order.shopName || `#${order.shopId}`}</dd></div>
            <div><dt>Thanh toán</dt><dd>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd></div>
            <div><dt>Cập nhật gần nhất</dt><dd>{formatDate(order.updatedAt)}</dd></div>
            <div><dt>Mã phiên checkout</dt><dd>#{order.checkoutSessionId}</dd></div>
          </dl>

          <h3>Địa chỉ nhận hàng</h3>
          <div className="stack" style={{ gap: 6, marginBottom: 16 }}>
            <div className="row"><User size={15} className="muted" /> {order.shippingAddress?.recipientName || "—"}</div>
            <div className="row"><Phone size={15} className="muted" /> {order.shippingAddress?.phone || "—"}</div>
            <div className="row"><MapPin size={15} className="muted" /> {order.shippingAddress?.fullAddress || "—"}</div>
          </div>

          <h3>Sản phẩm ({order.items?.length ?? 0})</h3>
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

          <div className="row muted" style={{ marginTop: 14, fontSize: 12 }}>
            <Store size={14} /> Đơn được tách theo shop khi thanh toán.
          </div>
        </>
      )}
    </Modal>
  );
}
