// Tầng 1A — chỉ nhận data qua props, không tự gọi hook query bên trong.
export default function CartItemRow({ item, onQuantityChange, onRemove }) {
  return (
    <div className="cart-item-row">
      <img src={item.thumbnailUrl} alt={item.productName} />
      <span>{item.productName}</span>
      <input
        type="number"
        min={1}
        value={item.quantity}
        onChange={(e) => onQuantityChange(Number(e.target.value))}
      />
      <span>{(item.unitPriceMinor * item.quantity).toLocaleString("vi-VN")}₫</span>
      <button onClick={onRemove}>Xoá</button>
    </div>
  );
}
