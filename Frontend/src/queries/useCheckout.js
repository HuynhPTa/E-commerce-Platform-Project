import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { checkout, fetchCheckoutResult } from '../api/checkout.api'
import { fetchCart } from '../api/cart.api'
import { MOCK_CART } from './mockCart'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_CART === 'true'

const labelFromAttributes = (attributes) =>
  attributes && typeof attributes === 'object'
    ? Object.values(attributes).filter(Boolean).join(' / ')
    : ''

/**
 * Chuẩn hoá CartItemResponse của BE và mock về cùng một shape cho UI checkout.
 * BE trả mảng phẳng; mock cũ trả { items } nên nhận cả hai.
 */
function normalizeItem(item) {
  return {
    ...item, // giữ nguyên field gốc (stockQuantity, attributes...) cho các trang dùng chung cache ['cart']
    id: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
    productName: item.productName,
    variantLabel: item.variantLabel ?? labelFromAttributes(item.attributes),
    unitPriceMinor: item.unitPriceMinor ?? item.price ?? 0,
    thumbnailUrl: item.thumbnailUrl ?? item.imageUrl ?? null,
    shopId: item.shopId,
    shopName: item.shopName || 'Shop',
  }
}

function normalizeCart(cart) {
  const items = Array.isArray(cart) ? cart : cart?.items ?? []
  return items.map(normalizeItem)
}

/** Giỏ hàng cho trang checkout. Cùng key ['cart'] với CV4 nên dùng chung cache. */
export function useCheckoutCart() {
  return useQuery({
    queryKey: ['cart'],
    // Cache ['cart'] giữ nguyên shape của BE để trang giỏ hàng/header dùng chung;
    // select chỉ chuẩn hoá dữ liệu cho UI checkout.
    queryFn: () => (USE_MOCK ? Promise.resolve(MOCK_CART) : fetchCart()),
    select: normalizeCart,
    staleTime: 0, // sai giá / sai tồn kho nên luôn refetch nền
  })
}

/** Kết quả checkout: luôn đọc từ GET /api/checkout/{id}, không dùng tham số URL. */
export function useCheckoutResult(checkoutId) {
  return useQuery({
    queryKey: ['checkout', checkoutId],
    queryFn: () => fetchCheckoutResult(checkoutId),
    enabled: Number.isInteger(checkoutId) && checkoutId > 0,
    retry: false,
    staleTime: 0,
  })
}

/**
 * Checkout KHÔNG optimistic: liên quan tiền và tồn kho, phải chờ BE xác nhận.
 * Thành công -> invalidate cache liên quan -> sang màn hình kết quả đọc lại từ BE.
 * Cổng thanh toán VNPay/MoMo (F13/F14) chưa làm; createPaymentUrl để sẵn cho bước sau.
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

      navigate({
        to: '/checkout/result',
        search: { checkoutId: session.checkoutSessionId },
      })
    },
    // lỗi (vd 409 hết hàng): không điều hướng, trang tự hiển thị mutation.error
  })
}
