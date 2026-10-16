import { z } from 'zod'

export const PAYMENT_METHODS = ['VNPAY', 'MOMO']

// Quy tắc khớp với CheckoutRequest.java (BE vẫn validate lại)
export const checkoutSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên người nhận')
    .max(120, 'Tên người nhận tối đa 120 ký tự'),
  phone: z.string().regex(/^[0-9]{9,11}$/, 'Số điện thoại phải gồm 9 đến 11 chữ số'),
  fullAddress: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập địa chỉ nhận hàng')
    .max(500, 'Địa chỉ tối đa 500 ký tự'),
  paymentMethod: z.enum(PAYMENT_METHODS, { message: 'Vui lòng chọn cổng thanh toán' }),
})
