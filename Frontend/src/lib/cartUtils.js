// Dùng chung cho trang giỏ hàng (CV4) và trang checkout (CV5)

export const formatVnd = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0)

/** Gom item theo shop, giữ thứ tự xuất hiện. Trả về [{ shopId, shopName, items, subtotal }] */
export function groupByShop(items = []) {
  const map = new Map()
  for (const item of items) {
    if (!map.has(item.shopId)) {
      map.set(item.shopId, { shopId: item.shopId, shopName: item.shopName, items: [], subtotal: 0 })
    }
    const group = map.get(item.shopId)
    group.items.push(item)
    group.subtotal += (item.unitPriceMinor ?? 0) * item.quantity
  }
  return [...map.values()]
}
