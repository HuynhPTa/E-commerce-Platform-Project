import { Link, useLocation } from '@tanstack/react-router'
import { CircleCheck, Clock3, RefreshCw, ShoppingBag, TriangleAlert, XCircle } from 'lucide-react'
import { formatVnd } from '../lib/cartUtils'
import { errMsg } from '../lib/errors'
import { useCheckoutResult } from '../queries/useCheckout'

const SESSION_STATUS = {
  PENDING: { label: 'Chờ thanh toán', className: 'badge-warning', Icon: Clock3 },
  PAID: { label: 'Đã thanh toán', className: 'badge-success', Icon: CircleCheck },
  FAILED: { label: 'Thanh toán thất bại', className: 'badge-danger', Icon: XCircle },
  EXPIRED: { label: 'Phiên đã hết hạn', className: 'badge-muted', Icon: Clock3 },
}

const ORDER_STATUS = {
  PENDING: { label: 'Chờ xác nhận', className: 'badge-warning' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'badge-info' },
  SHIPPING: { label: 'Đang giao', className: 'badge-info' },
  DELIVERED: { label: 'Đã giao', className: 'badge-success' },
  COMPLETED: { label: 'Hoàn tất', className: 'badge-success' },
  CANCELLED: { label: 'Đã huỷ', className: 'badge-danger' },
}

const PAYMENT_LABEL = { VNPAY: 'VNPay', MOMO: 'MoMo' }

export default function CheckoutResultPage() {
  const { search } = useLocation()
  const checkoutId = Number(search?.checkoutId)
  const validId = Number.isInteger(checkoutId) && checkoutId > 0

  const { data, isPending, isError, error, refetch, isFetching } = useCheckoutResult(checkoutId)

  if (!validId) {
    return (
      <div className="card center-box">
        <TriangleAlert size={40} />
        <h1>Không xác định được phiên thanh toán</h1>
        <p>Đường dẫn kết quả không hợp lệ hoặc đã bị cắt.</p>
        <Link to="/cart" className="btn btn-primary">Về giỏ hàng</Link>
      </div>
    )
  }

  if (isPending) return <div className="center-box">Đang tải kết quả đặt hàng…</div>

  if (isError) {
    return (
      <div className="card card-body">
        <div className="alert alert-danger" role="alert">
          <TriangleAlert size={18} />
          <div>
            <strong>Không tải được kết quả đặt hàng</strong>
            <div>{errMsg(error, 'Vui lòng thử lại sau')}</div>
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={16} /> Thử lại
          </button>
          <Link to="/products" className="btn">Về trang sản phẩm</Link>
        </div>
      </div>
    )
  }

  const status = SESSION_STATUS[data.status] ?? {
    label: data.status,
    className: 'badge-muted',
    Icon: CircleCheck,
  }
  const orders = data.orders ?? []

  return (
    <div className="checkout-result card">
      <div className="checkout-result__head">
        <CircleCheck size={42} />
        <div>
          <h1>Đặt hàng thành công</h1>
          <p className="muted">Mã phiên thanh toán #{data.checkoutSessionId}</p>
        </div>
        <span className={`badge ${status.className}`}>
          <status.Icon size={12} /> {status.label}
        </span>
      </div>

      <div className="alert alert-info">
        <ShoppingBag size={18} />
        <div>
          Đơn hàng đã được tạo và giữ tồn kho. Thanh toán VNPay/MoMo sẽ được tích hợp ở bước tiếp theo;
          hiện đơn đang ở trạng thái <strong>{status.label.toLowerCase()}</strong>.
        </div>
      </div>

      <dl className="checkout-result__summary">
        <div>
          <dt>Phương thức thanh toán</dt>
          <dd>{PAYMENT_LABEL[data.paymentMethod] ?? data.paymentMethod}</dd>
        </div>
        <div>
          <dt>Số đơn theo shop</dt>
          <dd>{orders.length}</dd>
        </div>
        <div>
          <dt>Tổng tiền</dt>
          <dd className="checkout-result__total">{formatVnd(data.totalAmountMinor)}</dd>
        </div>
      </dl>

      <h2>Đơn hàng theo shop</h2>
      <ul className="checkout-result__orders">
        {orders.map((order) => {
          const orderStatus = ORDER_STATUS[order.status] ?? {
            label: order.status,
            className: 'badge-muted',
          }
          return (
            <li key={order.orderId} className="checkout-result__order">
              <div>
                <strong>Đơn #{order.orderId}</strong>
                <div className="muted">Shop #{order.shopId}</div>
              </div>
              <span className={`badge ${orderStatus.className}`}>{orderStatus.label}</span>
              <div className="muted">{order.itemCount} sản phẩm</div>
              <strong>{formatVnd(order.totalMinor)}</strong>
            </li>
          )
        })}
      </ul>

      <div className="row checkout-result__actions">
        <Link to="/products" className="btn btn-primary">Tiếp tục mua sắm</Link>
        <Link to="/cart" className="btn">Về giỏ hàng</Link>
      </div>
    </div>
  )
}
