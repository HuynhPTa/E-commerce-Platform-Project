import { Link, useLocation } from '@tanstack/react-router'
import {
  CircleCheck, Clock3, CreditCard, LoaderCircle, RefreshCw, ShoppingBag, TriangleAlert, XCircle,
} from 'lucide-react'
import { formatVnd } from '../lib/cartUtils'
import { errMsg } from '../lib/errors'
import { useCheckoutResult, useCreatePaymentUrl } from '../queries/useCheckout'
import { useShop } from '../queries/useShops'

const SESSION_STATUS = {
  PENDING: {
    label: 'Chờ thanh toán', className: 'badge-warning', Icon: Clock3, tone: 'warning',
    heading: 'Đơn hàng đã được tạo',
    message: 'Đơn hàng đã được tạo và giữ tồn kho. Hoàn tất thanh toán để shop xác nhận đơn.',
  },
  PAID: {
    label: 'Đã thanh toán', className: 'badge-success', Icon: CircleCheck, tone: 'success',
    heading: 'Đặt hàng thành công',
    message: 'Thanh toán đã được ghi nhận. Đơn hàng đang chờ shop xác nhận.',
  },
  FAILED: {
    label: 'Thanh toán thất bại', className: 'badge-danger', Icon: XCircle, tone: 'danger',
    heading: 'Thanh toán thất bại',
    message: 'Giao dịch thanh toán không thành công. Vui lòng kiểm tra lại phương thức thanh toán hoặc đặt hàng mới.',
  },
  EXPIRED: {
    label: 'Phiên đã hết hạn', className: 'badge-muted', Icon: Clock3, tone: 'warning',
    heading: 'Phiên thanh toán đã hết hạn',
    message: 'Phiên thanh toán đã hết hạn. Vui lòng đặt lại đơn hàng nếu bạn vẫn muốn mua sản phẩm này.',
  },
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

const PAYMENT_STATUS = {
  PENDING: { label: 'Chưa thanh toán', className: 'badge-warning' },
  SUCCEEDED: { label: 'Đã thanh toán', className: 'badge-success' },
  FAILED: { label: 'Thanh toán thất bại', className: 'badge-danger' },
}

function ShopLabel({ shopId }) {
  const { data: shop } = useShop(shopId)
  return (
    <Link to="/shops/$shopId" params={{ shopId: String(shopId) }} className="checkout-result__shop">
      {shop?.name ?? `Shop #${shopId}`}
    </Link>
  )
}

export default function CheckoutResultPage() {
  const { search } = useLocation()
  const checkoutId = Number(search?.checkoutId)
  const validId = Number.isInteger(checkoutId) && checkoutId > 0

  const { data, isPending, isError, error, refetch, isFetching } = useCheckoutResult(checkoutId)
  const pay = useCreatePaymentUrl()

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
    tone: 'info',
    heading: 'Đã tạo đơn hàng',
    message: 'Đơn hàng đã được ghi nhận.',
  }
  const orders = data.orders ?? []
  const paymentStatus = PAYMENT_STATUS[data.paymentStatus] ?? {
    label: 'Chưa thanh toán',
    className: 'badge-warning',
  }
  const providerLabel = PAYMENT_LABEL[data.paymentMethod] ?? data.paymentMethod
  // Cho phép thử lại sau giao dịch thất bại; phiên hết hạn thì BE cũng từ chối tạo URL.
  const canPay = (data.status === 'PENDING' || data.status === 'FAILED')
    && data.paymentStatus !== 'SUCCEEDED'

  return (
    <div className="checkout-result card">
      <div className={`checkout-result__head checkout-result__head--${status.tone}`}>
        <status.Icon size={42} />
        <div>
          <h1>{status.heading}</h1>
          <p className="muted">Mã phiên thanh toán #{data.checkoutSessionId}</p>
        </div>
        <span className={`badge ${status.className}`}>
          <status.Icon size={12} /> {status.label}
        </span>
      </div>

      <div className={`alert alert-${status.tone}`}>
        <ShoppingBag size={18} />
        <div>{status.message}</div>
      </div>

      <dl className="checkout-result__summary">
        <div>
          <dt>Phương thức thanh toán</dt>
          <dd>{providerLabel}</dd>
        </div>
        <div>
          <dt>Trạng thái thanh toán</dt>
          <dd><span className={`badge ${paymentStatus.className}`}>{paymentStatus.label}</span></dd>
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

      {canPay && (
        <div className="checkout-result__pay">
          <div>
            <strong>Hoàn tất thanh toán qua {providerLabel}</strong>
            <p className="muted">
              Bạn sẽ được chuyển sang cổng thanh toán. Đơn hàng chỉ được xác nhận sau khi
              giao dịch thành công.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pay.isPending}
            onClick={() => pay.mutate({
              checkoutSessionId: data.checkoutSessionId,
              provider: data.paymentMethod,
            })}
          >
            {pay.isPending
              ? <><LoaderCircle size={16} className="spin" /> Đang tạo giao dịch…</>
              : <><CreditCard size={16} /> Thanh toán {providerLabel}</>}
          </button>
          {pay.isError && (
            <div className="alert alert-danger" role="alert">
              <TriangleAlert size={18} />
              <div>
                <strong>Không tạo được giao dịch thanh toán</strong>
                <div>{errMsg(pay.error, 'Vui lòng thử lại sau.')}</div>
                {pay.error?.response?.status === 503 && (
                  <div className="muted" style={{ marginTop: 4 }}>
                    Cổng thanh toán chưa được cấu hình credential sandbox.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
                <strong>
                  <Link to="/orders/$orderId" params={{ orderId: String(order.orderId) }}>
                    Đơn #{order.orderId}
                  </Link>
                </strong>
                <ShopLabel shopId={order.shopId} />
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
        <Link to="/orders" className="btn">Đơn hàng của tôi</Link>
        <Link to="/cart" className="btn">Về giỏ hàng</Link>
      </div>
    </div>
  )
}
