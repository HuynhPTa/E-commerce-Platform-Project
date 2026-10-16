import { useParams } from "@tanstack/react-router";
import { useProductQuery } from "../../queries/useProducts";
import { useAddToCartMutation } from "../../queries/useCart";
import VariantSelector from "../../components/product/VariantSelector";
import { useState } from "react";

export default function ProductDetailPage() {
  const { productId } = useParams({ from: "/products/$productId" });
  const { data: product, isLoading, isError } = useProductQuery(productId);
  const addToCart = useAddToCartMutation();
  const [selectedVariant, setSelectedVariant] = useState(null);

  if (isLoading) return <p>Đang tải…</p>;
  if (isError) return <p>Không tìm thấy sản phẩm.</p>;

  function handleAddToCart() {
    if (!selectedVariant) return;
    // UI cập nhật ngay (optimistic) — xem useAddToCartMutation để biết cơ chế rollback
    addToCart.mutate({ variantId: selectedVariant.id, quantity: 1 });
  }

  return (
    <section>
      <h1>{product.name}</h1>
      <VariantSelector variants={product.variants} onSelect={setSelectedVariant} />
      <button onClick={handleAddToCart} disabled={!selectedVariant}>
        Thêm vào giỏ
      </button>
      {addToCart.isError && <p role="alert">Không thể thêm — có thể đã hết hàng.</p>}
    </section>
  );
}
