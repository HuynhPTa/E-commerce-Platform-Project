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

  return (
    <section>
      <h1>Giỏ hàng</h1>
      {cart.map((item) => (
        <CartItemRow
          key={item.id}
          item={item}
          onQuantityChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
          onRemove={() => removeItem.mutate(item.id)}
        />
      ))}
      <Link to="/checkout">Tiến hành thanh toán</Link>
    </section>
  );
}
