// api/ — chỉ export hàm thuần trả Promise, không chứa logic cache.
import { apiClient } from './client'

export const checkout = (payload) =>
  apiClient.post('/checkout', payload).then((r) => r.data.result)

// Màn hình kết quả đọc lại dữ liệu thật từ server, không tin số liệu trên URL.
export const fetchCheckoutResult = (id) =>
  apiClient.get(`/checkout/${id}`).then((r) => r.data.result)

// CV6 (VNPay/MoMo) sẽ gọi hàm này. Hiện BE chưa có endpoint thanh toán nên checkout chưa dùng.
export const createPaymentUrl = ({ checkoutSessionId, provider }) =>
  apiClient
    .post('/payments/create-url', { checkoutSessionId, provider })
    .then((r) => r.data.result) // { redirectUrl }
