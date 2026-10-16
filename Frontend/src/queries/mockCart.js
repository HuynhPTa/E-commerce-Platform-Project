// Dữ liệu giả để dựng /checkout khi CV4 (giỏ hàng) chưa xong.
// Bật bằng VITE_USE_MOCK_CART=true trong .env.local
// Hình dạng item cần chốt với D: { id, variantId, quantity, productName, variantLabel, price, imageUrl, shopId, shopName }
export const MOCK_CART = {
  items: [
    { id: 1, variantId: 11, quantity: 2, productName: 'Áo thun basic', variantLabel: 'Đỏ / M', price: 120000, shopId: 1, shopName: 'Shop Thời Trang A' },
    { id: 2, variantId: 12, quantity: 1, productName: 'Quần jean slim', variantLabel: 'Xanh / 32', price: 350000, shopId: 1, shopName: 'Shop Thời Trang A' },
    { id: 3, variantId: 21, quantity: 1, productName: 'Tai nghe Bluetooth', variantLabel: 'Đen', price: 890000, shopId: 2, shopName: 'Shop Điện Tử B' },
  ],
}
