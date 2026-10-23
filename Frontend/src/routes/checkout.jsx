import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingCart, TriangleAlert } from 'lucide-react'
import ShopGroup from '../components/checkout/ShopGroup'
import { formatVnd, groupByShop } from '../lib/cartUtils'
import { errMsg } from '../lib/errors'
import { checkoutSchema } from '../schemas/checkout.schema'
import { useCheckout, useCheckoutCart } from '../queries/useCheckout'
import { useAddresses } from '../queries/useAddresses'

const STOCK_ERROR_CODES = [1033, 1062, 1063] // hết hàng / món không thuộc giỏ / sản phẩm ngừng bán

export default function CheckoutPage() {
  const { data: cart, isPending, isError, error, refetch } = useCheckoutCart()
  const addressesQuery = useAddresses()
  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data])
  const checkoutMutation = useCheckout()

  const [selectedAddressId, setSelectedAddressId] = useState('')
  const prefilled = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: { recipientName: '', phone: '', fullAddress: '', paymentMethod: 'VNPAY' },
  })

  // Derived data: tính trong render/useMemo, không copy vào state
  const items = useMemo(() => cart ?? [], [cart])
  const groups = useMemo(() => groupByShop(items), [items])
  const total = useMemo(() => groups.reduce((sum, g) => sum + g.subtotal, 0), [groups])
  // Item optimistic của CV4 chưa có id thật thì BE sẽ từ chối -> khóa nút chờ đồng bộ
  const hasUnsyncedItem = useMemo(() => items.some((i) => !Number.isInteger(i.id)), [items])

  const fillFromAddress = useCallback(
    (addr) => {
      if (!addr) return
      const opts = { shouldValidate: true }
      setValue('recipientName', addr.recipientName ?? '', opts)
      setValue('phone', addr.phone ?? '', opts)
      setValue('fullAddress', addr.fullAddress ?? '', opts)
    },
    [setValue]
  )

  // Tự điền địa chỉ mặc định đúng một lần khi tải xong, không ghi đè nếu người dùng đã sửa
  useEffect(() => {
    if (prefilled.current || addresses.length === 0) return
    const def = addresses.find((a) => a.defaultAddress) ?? addresses[0]
    setSelectedAddressId(def.id)
    fillFromAddress(def)
    prefilled.current = true
  }, [addresses, fillFromAddress])

  function handleAddressChange(e) {
    const id = Number(e.target.value)
    setSelectedAddressId(id)
    fillFromAddress(addresses.find((a) => a.id === id))
  }

  function onSubmit(values) {
    if (checkoutMutation.isPending || hasUnsyncedItem || items.length === 0) return
    checkoutMutation.mutate({
      ...values,
      cartItemIds: items.map((i) => i.id),
    })
  }

  if (isPending) return <div className="center-box">Đang tải giỏ hàng…</div>

  if (isError) {
    return (
      <div className="card card-body">
        <div className="alert alert-danger" role="alert">
          <TriangleAlert size={18} />
          <div>
            <strong>Không tải được giỏ hàng</strong>
            <div>{errMsg(error, 'Vui lòng đăng nhập lại rồi thử lại')}</div>
          </div>
        </div>
        <button className="btn" onClick={() => refetch()}>Thử lại</button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="card center-box">
        <ShoppingCart size={44} />
        <h1>Giỏ hàng trống</h1>
        <p>Chưa có sản phẩm nào để thanh toán.</p>
        <Link to="/products" className="btn btn-primary">Mua sắm ngay</Link>
      </div>
    )
  }

  const serverError = checkoutMutation.isError
    ? errMsg(checkoutMutation.error, 'Không thể đặt hàng, vui lòng thử lại')
    : null
  const serverErrorCode = checkoutMutation.error?.response?.data?.code
  const isStockError = STOCK_ERROR_CODES.includes(serverErrorCode)

  return (
    <div className="checkout-page">
      <h1>Thanh toán</h1>

      <div className="checkout-layout">
        {/* Sản phẩm gom theo shop */}
        <div className="checkout-groups">
          {groups.map((g) => (
            <ShopGroup key={g.shopId} shopName={g.shopName} items={g.items} subtotal={g.subtotal} />
          ))}
        </div>

        <form className="checkout-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2>Địa chỉ nhận hàng</h2>

          {addressesQuery.isLoading && <p className="muted">Đang tải địa chỉ đã lưu…</p>}

          {addressesQuery.isError && (
            <div className="alert alert-warning">
              <TriangleAlert size={18} />
              <div>
                Không tải được địa chỉ đã lưu. Bạn vẫn có thể nhập tay bên dưới hoặc{' '}
                <Link to="/addresses">quản lý địa chỉ</Link>.
              </div>
            </div>
          )}

          {addresses.length > 0 && (
            <div className="field">
              <label htmlFor="saved-address">Chọn địa chỉ đã lưu</label>
              <select id="saved-address" value={selectedAddressId} onChange={handleAddressChange}>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.defaultAddress ? '[Mặc định] ' : ''}
                    {a.recipientName} — {a.fullAddress}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!addressesQuery.isLoading && addresses.length === 0 && (
            <p className="muted">
              Bạn chưa có địa chỉ đã lưu. <Link to="/addresses">Thêm địa chỉ</Link> hoặc nhập trực tiếp bên dưới.
            </p>
          )}

          <div className={`field${errors.recipientName ? ' has-error' : ''}`}>
            <label className="required" htmlFor="recipientName">Người nhận</label>
            <input id="recipientName" autoComplete="name" {...register('recipientName')} />
            {errors.recipientName && <p className="error" role="alert">{errors.recipientName.message}</p>}
          </div>

          <div className={`field${errors.phone ? ' has-error' : ''}`}>
            <label className="required" htmlFor="phone">Số điện thoại</label>
            <input id="phone" inputMode="numeric" autoComplete="tel" {...register('phone')} />
            {errors.phone && <p className="error" role="alert">{errors.phone.message}</p>}
          </div>

          <div className={`field${errors.fullAddress ? ' has-error' : ''}`}>
            <label className="required" htmlFor="fullAddress">Địa chỉ</label>
            <textarea id="fullAddress" rows={3} autoComplete="street-address" {...register('fullAddress')} />
            {errors.fullAddress && <p className="error" role="alert">{errors.fullAddress.message}</p>}
          </div>

          <fieldset className="checkout-payments">
            <legend>Cổng thanh toán</legend>
            <label>
              <input type="radio" value="VNPAY" {...register('paymentMethod')} /> VNPay
            </label>
            <label>
              <input type="radio" value="MOMO" {...register('paymentMethod')} /> MoMo
            </label>
            {errors.paymentMethod && <span role="alert">{errors.paymentMethod.message}</span>}
          </fieldset>

          <div className="checkout-total">
            <span>Tổng thanh toán ({groups.length} shop)</span>
            <strong>{formatVnd(total)}</strong>
          </div>

          {hasUnsyncedItem && (
            <div className="alert alert-warning">
              <TriangleAlert size={18} />
              <div>Giỏ hàng đang được cập nhật, vui lòng chờ trong giây lát rồi đặt hàng.</div>
            </div>
          )}

          {serverError && (
            <div className="alert alert-danger" role="alert">
              <TriangleAlert size={18} />
              <div>
                <strong>Không thể đặt hàng</strong>
                <div>{serverError}</div>
                {isStockError && (
                  <div className="muted">
                    Vui lòng kiểm tra lại số lượng trong <Link to="/cart">giỏ hàng</Link>.
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="muted">
            Đơn được ghi nhận ngay sau khi đặt. Bước thanh toán VNPay/MoMo sẽ được bổ sung ở giai đoạn tiếp theo.
          </p>

          {/* disabled khi đang gửi: chặn bấm đúp; khóa luôn khi còn item optimistic */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={!isValid || checkoutMutation.isPending || hasUnsyncedItem}
          >
            {checkoutMutation.isPending ? 'Đang xử lý…' : 'Đặt hàng'}
          </button>
        </form>
      </div>
    </div>
  )
}
