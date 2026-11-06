import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import ProductForm from "../../../components/seller/ProductForm";
import { useCreateAdminProduct } from "../../../queries/useAdminProducts";
import { errMsg } from "../../../lib/errors";

export default function NewAdminProductPage() {
  const navigate = useNavigate();
  const mutation = useCreateAdminProduct();

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
          to: "/admin/products/$productId",
          params: { productId: String(product.id) },
        }),
      },
    );
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/admin/products">Sản phẩm</Link>
        <ChevronRight size={14} />
        <span>Thêm sản phẩm</span>
      </div>
      <div className="page-title">
        <h1>Thêm sản phẩm</h1>
      </div>

      <ProductForm
        mode="create"
        basePath="/admin/products"
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
        error={mutation.isError ? errMsg(mutation.error) : ""}
      />
    </div>
  );
}
