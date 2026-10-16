import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ShopGroup from '../components/checkout/ShopGroup'
import { formatVnd, groupByShop } from '../lib/cartUtils'
import { checkoutSchema } from '../schemas/checkout.schema'
import { useAddresses, useCheckout, useCheckoutCart } from '../queries/useCheckout'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const { data: cart, isPending, isError, refetch } = useCheckoutCart()
  const { data: addresses = [] } = useAddresses()
  const checkoutMutation = useCheckout()

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

  // Derived data: tính trong render, không copy vào state
  const items = cart?.items ?? []
  const groups = useMemo(() => groupByShop(items), [items])
  const total = groups.reduce((sum, g) => sum + g.subtotal, 0)
  const hasTempItem = items.some((i) => String(i.id).startsWith('tmp-')) // item optimistic chưa có id thật

  const fillFromAddress = (addr) => {
    const opts = { shouldValidate: true }
    setValue('recipientName', addr.recipientName, opts)
    setValue('phone', addr.phone, opts)
    setValue('fullAddress', addr.fullAddress, opts)
  }

  // Tự điền địa chỉ mặc định khi tải xong
  useEffect(() => {
    if (addresses.length === 0) return
    const def = addresses.find((a) => a.defaultAddress) ?? addresses[0]
    fillFromAddress(def)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses])

  const onSubmit = (values) => {
    checkoutMutation.mutate({ ...values, cartItemIds: items.map((i) => i.id) })
  }

  if (isPending) return <div>Đang tải giỏ hàng...</div>
  if (isError) {
    return (
      <div>
        Không tải được giỏ hàng. <button onClick={() => refetch()}>Thử lại</button>
      </div>
    )
  }
  if (items.length === 0) return <div>Giỏ hàng trống, chưa có gì để thanh toán.</div>

  const serverError = checkoutMutation.isError
    ? checkoutMutation.error?.response?.data?.message ?? 'Không thể đặt hàng, vui lòng thử lại'
    : null

  return (
    <div className="checkout-page">
      <h1>Thanh toán</h1>

      <div className="checkout-layout">
        {/* Sản phẩm gom theo shop */}
        <div className="checkout-groups">
          {groups.map((g) => (
            <ShopGroup key={g.shopId} {...g} />
          ))}
        </div>

        <form className="checkout-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2>Địa chỉ nhận hàng</h2>

          {addresses.length > 0 && (
            <label>
              Chọn địa chỉ đã lưu
              <select
                defaultValue={(addresses.find((a) => a.defaultAddress) ?? addresses[0]).id}
                onChange={(e) => fillFromAddress(addresses.find((a) => a.id === Number(e.target.value)))}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.recipientName} - {a.fullAddress}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Người nhận
            <input {...register('recipientName')} />
            {errors.recipientName && <span role="alert">{errors.recipientName.message}</span>}
          </label>

          <label>
            Số điện thoại
            <input {...register('phone')} inputMode="numeric" />
            {errors.phone && <span role="alert">{errors.phone.message}</span>}
          </label>

          <label>
            Địa chỉ
            <textarea rows={3} {...register('fullAddress')} />
            {errors.fullAddress && <span role="alert">{errors.fullAddress.message}</span>}
          </label>

          <fieldset>
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
            Tổng thanh toán ({groups.length} đơn): <strong>{formatVnd(total)}</strong>
          </div>

          {serverError && <div role="alert">{serverError}</div>}

          {/* disabled khi đang gửi: chặn bấm đúp */}
          <button type="submit" disabled={!isValid || checkoutMutation.isPending || hasTempItem}>
            {checkoutMutation.isPending ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </form>
      </div>
    </div>
  )
}
