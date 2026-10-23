import { Link } from "@tanstack/react-router";
import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";
import { assetUrl, onImageError } from "../../lib/assetUrl";
import { formatVnd } from "../../lib/cartUtils";

// Tầng 1A — chỉ nhận data qua props, không tự gọi hook query bên trong.
export default function CartItemRow({ item, onQuantityChange, onRemove, pending = false }) {
  const attributes = Object.entries(item.attributes ?? {});
  const maxQuantity = Math.max(1, item.stockQuantity ?? 1);
  const canDecrease = !pending && item.quantity > 1;
  const canIncrease = !pending && item.quantity < maxQuantity;
  const lowStock = item.stockQuantity > 0 && item.stockQuantity <= 5;
  const productId = Number.isInteger(item.productId) ? String(item.productId) : null;

  const thumb = item.thumbnailUrl ? (
    <img src={assetUrl(item.thumbnailUrl)} alt="" loading="lazy" onError={onImageError} />
  ) : (
    <span className="cart-item__noimg"><ImageOff size={22} /></span>
  );

  return (
    <article className={`cart-item${pending ? " is-pending" : ""}`}>
      {productId ? (
        <Link to="/products/$productId" params={{ productId }} className="cart-item__thumb">{thumb}</Link>
      ) : (
        <span className="cart-item__thumb">{thumb}</span>
      )}

      <div className="cart-item__info">
        {productId ? (
          <Link to="/products/$productId" params={{ productId }} className="cart-item__name">
            {item.productName}
          </Link>
        ) : (
          <strong className="cart-item__name">{item.productName}</strong>
        )}
        {attributes.length > 0 && (
          <div className="cart-item__variant">
            {attributes.map(([key, value]) => `${key}: ${value}`).join(" · ")}
          </div>
        )}
        {item.stockQuantity <= 0 ? (
          <span className="cart-item__stock is-out">Hết hàng</span>
        ) : lowStock ? (
          <span className="cart-item__stock is-low">Chỉ còn {item.stockQuantity} sản phẩm</span>
        ) : null}
      </div>

      <div className="cart-item__price">{formatVnd(item.unitPriceMinor)}</div>

      <div className="cart-qty" aria-label={`Số lượng ${item.productName}`}>
        <button type="button" aria-label="Giảm số lượng" disabled={!canDecrease}
                onClick={() => onQuantityChange(item.quantity - 1)}>
          <Minus size={14} />
        </button>
        <span aria-live="polite">{item.quantity}</span>
        <button type="button" aria-label="Tăng số lượng" disabled={!canIncrease}
                onClick={() => onQuantityChange(item.quantity + 1)}>
          <Plus size={14} />
        </button>
      </div>

      <div className="cart-item__total">{formatVnd(item.unitPriceMinor * item.quantity)}</div>

      <button type="button" className="cart-item__remove" aria-label={`Xoá ${item.productName}`}
              title="Xoá khỏi giỏ hàng" disabled={pending} onClick={onRemove}>
        <Trash2 size={16} />
      </button>
    </article>
  );
}
