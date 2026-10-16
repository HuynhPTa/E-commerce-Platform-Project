import { formatVnd } from '../../lib/cartUtils'

/** Hiển thị các sản phẩm của 1 shop trong đơn. Tái dùng được cho trang giỏ hàng. */
export default function ShopGroup({ shopName, items, subtotal }) {
  return (
    <section className="checkout-shop">
      <h3 className="checkout-shop__name">{shopName}</h3>
      <ul className="checkout-shop__items">
        {items.map((item) => (
          <li key={item.id} className="checkout-item">
            {item.imageUrl && <img src={item.imageUrl} alt={item.productName} width={56} height={56} loading="lazy" />}
            <div className="checkout-item__info">
              <div>{item.productName}</div>
              {item.variantLabel && <small>{item.variantLabel}</small>}
            </div>
            <div>x{item.quantity}</div>
            <div>{formatVnd(item.price * item.quantity)}</div>
          </li>
        ))}
      </ul>
      <div className="checkout-shop__subtotal">
        Tạm tính ({items.length} sản phẩm): <strong>{formatVnd(subtotal)}</strong>
      </div>
    </section>
  )
}
