import { useState } from "react";

// Tầng 1A — state "đang chọn variant nào" chỉ liên quan tới UI của component này,
// KHÔNG phải server state (server state là danh sách variants, đến từ props).
// Nên dùng useState cục bộ, không đẩy lên Context/Redux/global.
export default function VariantSelector({ variants, onSelect }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);

  function handleSelect(variant) {
    setSelectedId(variant.id);
    onSelect(variant);
  }

  return (
    <div className="variant-selector">
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={v.id === selectedId}
          disabled={v.stockQuantity === 0}
          onClick={() => handleSelect(v)}
        >
          {Object.values(v.attributes).join(" / ") || "Mặc định"}
        </button>
      ))}
    </div>
  );
}
