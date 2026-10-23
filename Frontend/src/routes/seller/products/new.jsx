import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import ProductForm from "../../../components/seller/ProductForm";
import { useCreateSellerProduct } from "../../../queries/useSellerProducts";
import { errMsg } from "../../../lib/errors";

export default function NewSellerProductPage() {
  const navigate = useNavigate();
  const mutation = useCreateSellerProduct();

  function handleSubmit(values) {
    mutation.mutate(
      {
        name: values.name,
        description: values.description || null,
        categoryId: values.categoryId,
        variants: [{
          sku: values.sku || null,
          attributes: {},
          priceMinor: values.priceMinor,
          stockQuantity: values.stockQuantity,
          imageUrl: null,
        }],
      },
      {
        // Sang trang sửa để thêm biến thể và ảnh ngay sau khi tạo
        onSuccess: (product) => navigate({
          to: "/seller/products/$productId",
          params: { productId: String(product.id) },
        }),
      },
    );
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/seller/products">Sản phẩm</Link>
        <ChevronRight size={14} />
        <span>Thêm sản phẩm</span>
      </div>
      <div className="page-title">
        <h1>Thêm sản phẩm</h1>
      </div>

      <ProductForm
        mode="create"
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
        error={mutation.isError ? errMsg(mutation.error) : ""}
      />
    </div>
  );
}
