import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ChevronRight, LoaderCircle, ShoppingCart, Star } from "lucide-react";
import { useProductQuery } from "../../queries/useProducts";
import { useAddToCartMutation } from "../../queries/useCart";
import VariantSelector from "../../components/product/VariantSelector";
import ProductImageGallery from "../../components/product/ProductImageGallery";
import { formatVnd } from "../../lib/format";

export default function ProductDetailPage() {
  const { productId } = useParams({ from: "/products/$productId" });
  const { data: product, isLoading, isError } = useProductQuery(productId);
  const addToCart = useAddToCartMutation();
  const [selectedVariant, setSelectedVariant] = useState(null);

  if (isLoading) return <div className="center-box"><LoaderCircle className="spin" /> Đang tải sản phẩm…</div>;
  if (isError || !product) return <p>Không tìm thấy sản phẩm.</p>;

  const variants = product.variants ?? [];
  // Ưu tiên biến thể người dùng chọn, sau đó biến thể còn hàng đầu tiên
  const matchedVariant = selectedVariant
    ? variants.find((v) => v.id === selectedVariant.id) ?? null
    : null;
  const activeVariant = matchedVariant
    ?? variants.find((v) => v.stockQuantity > 0)
    ?? variants[0]
    ?? null;
  const outOfStock = !activeVariant || activeVariant.stockQuantity <= 0;
  const attributeText = Object.entries(activeVariant?.attributes ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");

  function handleAddToCart() {
    if (!activeVariant || outOfStock) return;
    // UI cập nhật ngay (optimistic) — xem useAddToCartMutation để biết cơ chế rollback
    addToCart.mutate({ variantId: activeVariant.id, quantity: 1 });
  }

  return (
    <section>
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to="/products">Sản phẩm</Link>
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </div>

      <div className="product-detail">
        <ProductImageGallery
          key={product.id}
          images={product.images ?? []}
          fallbackUrl={product.thumbnailUrl}
          name={product.name}
        />

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <div className="product-meta">
            <span className="row" style={{ gap: 4 }}>
              <Star size={14} /> {product.ratingAvg.toFixed(1)} ({product.ratingCount})
            </span>
            <span>Đã bán {product.soldCount}</span>
          </div>

          <div className="product-price">{formatVnd(activeVariant?.priceMinor ?? 0)}</div>
          {activeVariant && (
            <div className="cell-sub" style={{ marginBottom: 14 }}>
              {attributeText && <span>{attributeText} · </span>}
              {outOfStock ? "Hết hàng" : `Còn ${activeVariant.stockQuantity} sản phẩm`}
            </div>
          )}

          {variants.length > 0 && (
            <div className="field">
              <label>Phân loại</label>
              <VariantSelector
                variants={variants}
                selectedId={activeVariant?.id}
                onSelect={setSelectedVariant}
              />
            </div>
          )}

          <button className="btn btn-primary" disabled={outOfStock || addToCart.isPending}
                  onClick={handleAddToCart}>
            <ShoppingCart size={16} /> Thêm vào giỏ
          </button>

          {addToCart.isError && <p role="alert">Không thể thêm — có thể đã hết hàng.</p>}
          {addToCart.isSuccess && <p className="muted" style={{ marginTop: 8 }}>Đã thêm vào giỏ.</p>}

          <div className="product-desc">
            <h3>Mô tả sản phẩm</h3>
            <p className="muted" style={{ whiteSpace: "pre-line" }}>
              {product.description || "Người bán chưa cập nhật mô tả."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
