// Dữ liệu giả để dựng /checkout khi CV4 (giỏ hàng) chưa xong.
// Bật bằng VITE_USE_MOCK_CART=true trong .env.local
// Shape mô phỏng CartItemResponse của BE; useCheckoutCart sẽ chuẩn hoá lại.
export const MOCK_CART = {
  items: [
    { id: 1, variantId: 11, quantity: 2, productName: 'Áo thun basic', attributes: { color: 'Đỏ', size: 'M' }, unitPriceMinor: 120000, shopId: 1, shopName: 'Shop Thời Trang A' },
    { id: 2, variantId: 12, quantity: 1, productName: 'Quần jean slim', attributes: { color: 'Xanh', size: '32' }, unitPriceMinor: 350000, shopId: 1, shopName: 'Shop Thời Trang A' },
    { id: 3, variantId: 21, quantity: 1, productName: 'Tai nghe Bluetooth', attributes: { color: 'Đen' }, unitPriceMinor: 890000, shopId: 2, shopName: 'Shop Điện Tử B' },
  ],
}
