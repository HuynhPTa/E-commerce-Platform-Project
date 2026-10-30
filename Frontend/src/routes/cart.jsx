import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, LoaderCircle, LogIn, ShoppingCart, Store, TriangleAlert,
} from "lucide-react";
import {
  useCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from "../queries/useCart";
import { hasToken } from "../queries/useMe";
import CartItemRow from "../components/cart/CartItemRow";
import { formatVnd, groupByShop } from "../lib/cartUtils";
import { errMsg } from "../lib/errors";

export default function CartPage() {
  const loggedIn = hasToken();
  const { data: cart, isLoading, isError, error, refetch } = useCartQuery();
  const updateItem = useUpdateCartItemMutation();
  const removeItem = useRemoveCartItemMutation();

  if (!loggedIn) {
    return (
      <div className="cart-page">
        <div className="card cart-empty">
          <span className="cart-empty__icon"><ShoppingCart size={40} /></span>
          <h1>Giỏ hàng của bạn</h1>
          <p>Đăng nhập để xem sản phẩm đã thêm và tiếp tục thanh toán.</p>
          <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" className="btn btn-primary"><LogIn size={16} /> Đăng nhập</Link>
            <Link to="/products" className="btn">Tiếp tục mua sắm</Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="center-box"><LoaderCircle className="spin" /> Đang tải giỏ hàng…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="cart-page">
        <div className="card card-body">
          <div className="alert alert-danger" style={{ marginBottom: 12 }}>
            <TriangleAlert size={18} />
            <div>
              <strong>Không tải được giỏ hàng</strong>
              <div>{errMsg(error, "Vui lòng thử lại sau.")}</div>
            </div>
          </div>
          <button className="btn" onClick={() => refetch()}>Thử lại</button>
        </div>
      </div>
    );
  }

  const items = cart ?? [];
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="card cart-empty">
          <span className="cart-empty__icon"><ShoppingCart size={40} /></span>
          <h1>Giỏ hàng đang trống</h1>
          <p>Khám phá sản phẩm trên MarketHub và thêm món bạn thích vào giỏ nhé.</p>
          <Link to="/products" className="btn btn-primary">Khám phá sản phẩm <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  const groups = groupByShop(items);
  const total = groups.reduce((sum, group) => sum + group.subtotal, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasUnsyncedItem = items.some((item) => !Number.isInteger(item.id));
  const mutationError = updateItem.error ?? removeItem.error;
  const pendingItemId = updateItem.isPending
    ? updateItem.variables?.itemId
    : removeItem.isPending ? removeItem.variables : null;

  return (
    <div className="cart-page">
      <div className="page-title">
        <h1>
          Giỏ hàng <span className="cart-count-pill">{totalQuantity} sản phẩm</span>
        </h1>
        <Link to="/products" className="btn btn-ghost"><ArrowLeft size={16} /> Tiếp tục mua sắm</Link>
      </div>

      {mutationError && (
        <div className="alert alert-danger">
          <TriangleAlert size={18} />
          <div>{errMsg(mutationError, "Không cập nhật được giỏ hàng. Vui lòng thử lại.")}</div>
        </div>
      )}

      <div className="cart-layout">
        <div className="cart-groups">
          {groups.map((group, index) => {
            const groupQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <section className="card cart-shop" key={group.shopId ?? `shop-${index}`}>
                <header className="cart-shop__head">
                  <Store size={18} />
                  {group.shopId ? (
                    <Link to="/shops/$shopId" params={{ shopId: String(group.shopId) }} className="cart-shop__name">
                      {group.shopName || `Shop #${group.shopId}`}
                    </Link>
                  ) : (
                    <strong>{group.shopName || "Shop"}</strong>
                  )}
                  <span className="spacer" />
                  <span className="cell-sub">{group.items.length} sản phẩm</span>
                </header>

                <div className="cart-shop__items">
                  {group.items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      pending={pendingItemId === item.id || !Number.isInteger(item.id)}
                      onQuantityChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
                      onRemove={() => removeItem.mutate(item.id)}
                    />
                  ))}
                </div>

                <footer className="cart-shop__foot">
                  <span>Tạm tính ({groupQuantity} sản phẩm)</span>
                  <strong>{formatVnd(group.subtotal)}</strong>
                </footer>
              </section>
            );
          })}
        </div>

        <aside className="card cart-summary">
          <h2>Tóm tắt đơn hàng</h2>
          <dl className="cart-summary__rows">
            <div>
              <dt>Tạm tính ({totalQuantity} sản phẩm)</dt>
              <dd>{formatVnd(total)}</dd>
            </div>
            <div>
              <dt>Phí vận chuyển</dt>
              <dd className="muted">Tính ở bước thanh toán</dd>
            </div>
          </dl>
          <div className="cart-summary__total">
            <span>Tổng cộng</span>
            <strong>{formatVnd(total)}</strong>
          </div>
          {hasUnsyncedItem ? (
            <button className="btn btn-primary btn-block" disabled>
              <LoaderCircle size={16} className="spin" /> Đang đồng bộ giỏ hàng…
            </button>
          ) : (
            <Link to="/checkout" className="btn btn-primary btn-block">
              Tiến hành thanh toán <ArrowRight size={16} />
            </Link>
          )}
          <p className="cart-summary__note">
            Đơn hàng được tách theo shop. Giá và tồn kho được kiểm tra lại khi thanh toán.
          </p>
        </aside>
      </div>
    </div>
  );
}
