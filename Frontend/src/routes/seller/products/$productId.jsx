import { Link, useParams } from "@tanstack/react-router";
import {
  ChevronRight, CircleCheck, ExternalLink, LoaderCircle, TriangleAlert,
} from "lucide-react";
import ProductForm from "../../../components/seller/ProductForm";
import VariantManager from "../../../components/seller/VariantManager";
import ImageManager from "../../../components/seller/ImageManager";
import { useSellerProduct, useUpdateSellerProduct } from "../../../queries/useSellerProducts";
import { errMsg, formatDate } from "../../../lib/errors";

export default function SellerProductDetailPage() {
  const { productId } = useParams({ from: "/seller/products/$productId" });
  const { data: product, isLoading, isError } = useSellerProduct(productId);
  const mutation = useUpdateSellerProduct();

  if (isLoading) {
    return <div className="center-box"><LoaderCircle className="spin" /> Đang tải sản phẩm…</div>;
  }

  if (isError || !product) {
    return (
      <div className="center-box">
        <TriangleAlert size={44} />
        <h1 style={{ color: "var(--text)" }}>Không tìm thấy sản phẩm</h1>
        <p>Sản phẩm không tồn tại hoặc không thuộc shop của bạn.</p>
        <Link to="/seller/products" className="btn btn-primary">Về danh sách sản phẩm</Link>
      </div>
    );
  }

  const deleted = product.status === "DELETED";

  function handleSubmit(values) {
    mutation.mutate({
      productId: product.id,
      name: values.name,
      description: values.description || null,
      categoryId: values.categoryId,
    });
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="breadcrumb">
        <Link to="/seller/products">Sản phẩm</Link>
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </div>

      <div className="page-title">
        <div>
          <h1>{product.name}</h1>
          <div className="row" style={{ gap: 8, marginTop: 6 }}>
            <span className={`badge ${deleted ? "badge-muted" : "badge-success"}`}>
              {deleted ? "Đã xoá" : "Đang bán"}
            </span>
            <span className="cell-sub">
              #{product.id} · {product.categoryName || "Chưa phân loại"} · Tạo ngày {formatDate(product.createdAt)}
            </span>
          </div>
        </div>
        {!deleted && (
          <Link to="/products/$productId" params={{ productId: String(product.id) }} target="_blank"
                className="btn btn-sm btn-outline">
            <ExternalLink size={14} /> Xem trên cửa hàng
          </Link>
        )}
      </div>

      {deleted && (
        <div className="alert alert-warning">
          <TriangleAlert size={18} />
          <div>
            <strong>Sản phẩm đã bị xoá mềm</strong>
            Không thể chỉnh sửa, thêm biến thể hay tải ảnh. Sản phẩm cũng không còn hiển thị với người mua.
          </div>
        </div>
      )}

      {mutation.isSuccess && !deleted && (
        <div className="alert alert-success">
          <CircleCheck size={18} /><div>Đã lưu thay đổi thông tin sản phẩm.</div>
        </div>
      )}
      {mutation.isError && (
        <div className="alert alert-danger">
          <TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div>
        </div>
      )}

      <ProductForm
        key={product.id}
        mode="edit"
        product={product}
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
        disabled={deleted}
      />

      <VariantManager key={`variants-${product.id}`} product={product} disabled={deleted} />
      <ImageManager key={`images-${product.id}`} product={product} disabled={deleted} />
    </div>
  );
}
