// Giả định: api/client.js export default axios instance (đã gắn token qua interceptor)
// và BE trả ApiResponse { code, message, result }.
import client from './client'

export const checkout = (payload) =>
  client.post('/api/checkout', payload).then((r) => r.data.result)

// Dùng cho trang /payment/return (CV6)
export const fetchCheckoutResult = (id) =>
  client.get(`/api/checkout/${id}`).then((r) => r.data.result)

// Của CV1 (A): danh sách địa chỉ đã lưu. Trùng key ['addresses'] nên dùng chung cache.
export const fetchAddresses = () => client.get('/api/addresses').then((r) => r.data.result)

export const fetchCart = () => client.get('/api/cart').then((r) => r.data.result)

// CV6 sẽ thay phần này. Thống nhất với người làm CV6 về path + body.
export const createPaymentUrl = ({ checkoutSessionId, provider }) =>
  client
    .post('/api/payments/create-url', { checkoutSessionId, provider })
    .then((r) => r.data.result) // { redirectUrl }
