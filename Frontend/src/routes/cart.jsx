import { Link } from "@tanstack/react-router";
import {
  useCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from "../queries/useCart";
import CartItemRow from "../components/cart/CartItemRow";

export default function CartPage() {
  const { data: cart, isLoading } = useCartQuery();
  const updateItem = useUpdateCartItemMutation();
  const removeItem = useRemoveCartItemMutation();

  if (isLoading) return <p>Đang tải giỏ hàng…</p>;
  if (!cart?.length) return <p>Giỏ hàng trống.</p>;

  const groups = Object.values(cart.reduce((result, item) => {
    const key = item.shopId ?? item.shopName ?? "shop-unknown";
    result[key] ??= { name: item.shopName || "Shop", items: [] };
    result[key].items.push(item);
    return result;
  }, {}));
  const total = cart.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0);

  return (
    <section>
      <h1>Giỏ hàng</h1>
      {groups.map((group, index) => (
        <section className="cart-shop-group" key={group.items[0].shopId ?? group.name ?? index}>
          <h2>{group.name}</h2>
          {group.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onQuantityChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
              onRemove={() => removeItem.mutate(item.id)}
            />
          ))}
          <p>Tạm tính shop: {group.items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0).toLocaleString("vi-VN")}₫</p>
        </section>
      ))}
      <h2>Tổng cộng: {total.toLocaleString("vi-VN")}₫</h2>
      <Link to="/checkout">Tiến hành thanh toán</Link>
    </section>
  );
}
