import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { checkout, createPaymentUrl, fetchAddresses, fetchCart } from '../api/checkout.api'
import { MOCK_CART } from './mockCart'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_CART === 'true'

/** Giỏ hàng cho trang checkout. Cùng key ['cart'] với CV4 nên dùng chung cache. */
export function useCheckoutCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => (USE_MOCK ? Promise.resolve(MOCK_CART) : fetchCart()),
    staleTime: 0, // sai giá / sai tồn kho nên luôn refetch nền
  })
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
    enabled: !USE_MOCK,
  })
}

/**
 * Checkout KHÔNG optimistic: liên quan tiền và tồn kho, phải chờ BE xác nhận.
 * Thành công -> invalidate cache liên quan -> xin URL cổng thanh toán -> chuyển hướng.
 */
export function useCheckout() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: checkout,
    onSuccess: async (session) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cart'] }),
        qc.invalidateQueries({ queryKey: ['orders', 'me'] }),
        qc.invalidateQueries({ queryKey: ['product'] }), // tồn kho đổi: mọi ['product', id]
      ])

      let redirectUrl
      try {
        const res = await createPaymentUrl({
          checkoutSessionId: session.checkoutSessionId,
          provider: session.paymentMethod,
        })
        redirectUrl = res?.redirectUrl
      } catch {
        // Đơn đã tạo nhưng chưa lấy được URL (CV6 chưa xong / lỗi mạng):
        // vẫn sang trang kết quả để người dùng thấy trạng thái PENDING.
      }

      if (redirectUrl) {
        window.location.assign(redirectUrl)
      } else {
        navigate({ to: '/payment/return', search: { checkoutId: session.checkoutSessionId } })
      }
    },
    // lỗi (vd 409 hết hàng): không điều hướng, trang tự hiển thị mutation.error
  })
}
