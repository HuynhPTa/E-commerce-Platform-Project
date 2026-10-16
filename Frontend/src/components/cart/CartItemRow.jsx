// Tầng 1A — chỉ nhận data qua props, không tự gọi hook query bên trong.
export default function CartItemRow({ item, onQuantityChange, onRemove }) {
  return (
    <div className="cart-item-row">
      <img src={item.thumbnailUrl} alt={item.productName} />
      <span>{item.productName}</span>
      <input
        type="number"
        min={1}
        max={item.stockQuantity}
        value={item.quantity}
        onChange={(e) => {
          const quantity = Number(e.target.value);
          if (Number.isInteger(quantity) && quantity >= 1) onQuantityChange(quantity);
        }}
      />
      <span>{(item.unitPriceMinor * item.quantity).toLocaleString("vi-VN")}₫</span>
      <button onClick={onRemove}>Xoá</button>
    </div>
  );
}
