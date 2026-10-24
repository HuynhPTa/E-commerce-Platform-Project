import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { assetUrl } from "../../lib/assetUrl";

// Tầng 1A — "Component/props/hooks, tránh state dư thừa".
// ProductCard KHÔNG tự gọi useProductQuery bên trong. Nơi fetch (route) và nơi
// hiển thị (component) phải tách biệt — trộn 2 việc này là đúng lỗi "đặt state dư thừa".
export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.priceMinor))
    : 0;
  const thumbnail = assetUrl(product.thumbnailUrl);

  return (
    <Link to="/products/$productId" params={{ productId: product.id }} className="product-card">
      {thumbnail && !imageFailed ? (
        <img src={thumbnail} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} />
      ) : (
        <div className="product-card-noimg"><ImageOff size={32} /></div>
      )}
      <h3>{product.name}</h3>
      <p>{(minPrice / 1).toLocaleString("vi-VN")}₫</p>
      <span>⭐ {product.ratingAvg.toFixed(1)} ({product.ratingCount})</span>
    </Link>
  );
}
