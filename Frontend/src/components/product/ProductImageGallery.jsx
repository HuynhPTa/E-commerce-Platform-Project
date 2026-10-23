import { useState } from "react";
import { ImageOff } from "lucide-react";

// Bộ ảnh sản phẩm phía người mua: 1 ảnh lớn + dải thumbnail.
// API ưu tiên trả images[]; nếu chưa có thì dùng thumbnailUrl để không vỡ giao diện cũ.
export default function ProductImageGallery({ images = [], fallbackUrl, name }) {
  const urls = images.length
    ? images.map((image) => image.url)
    : fallbackUrl ? [fallbackUrl] : [];
  const [active, setActive] = useState(0);

  if (!urls.length) {
    return (
      <div className="gallery-main gallery-empty">
        <ImageOff size={48} />
        <span>Chưa có ảnh</span>
      </div>
    );
  }

  const index = Math.min(active, urls.length - 1);

  return (
    <div className="product-gallery">
      <div className="gallery-main">
        <img src={urls[index]} alt={`${name} — ảnh ${index + 1}`} />
      </div>
      {urls.length > 1 && (
        <div className="gallery-thumbs">
          {urls.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              className={`gallery-thumb${i === index ? " active" : ""}`}
              aria-label={`Xem ảnh ${i + 1}`}
              onClick={() => setActive(i)}
            >
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
