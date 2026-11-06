import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import BieuMauSanPhamQuanTri from "../../components/admin/ProductForm";
import { useTaoSanPhamQuanTri } from "../../hooks/useAdminProducts";
import { layThongBaoLoi } from "../../lib/adminHelpers";

// Thành phần này hiển thị trang tạo sản phẩm mới.
export default function TrangThemSanPhamQuanTri() {
  const hamDieuHuong = useNavigate();
  const taoSanPham = useTaoSanPhamQuanTri();

  // Hàm này gửi dữ liệu sản phẩm mới lên backend.
  function xuLyGuiSanPham(giaTri) {
    // Biến này lưu mô tả sau khi bỏ khoảng trắng hai đầu.
    let moTa = null;

    if (giaTri.description !== "") {
      moTa = giaTri.description;
    }

    // Biến này lưu SKU của biến thể đầu tiên.
    let maSku = null;

    if (giaTri.sku !== "") {
      maSku = giaTri.sku;
    }

    const duLieuGui = {
      name: giaTri.name,
      description: moTa,
      categoryId: giaTri.categoryId,
      variants: [
        {
          sku: maSku,
          attributes: {},
          priceMinor: giaTri.priceMinor,
          stockQuantity: giaTri.stockQuantity,
          imageUrl: null,
        },
      ],
    };

    taoSanPham.mutate(duLieuGui, {
      onSuccess: function (sanPham) {
        hamDieuHuong("/admin/products/" + sanPham.id);
      },
    });
  }

  // Biến này lưu thông điệp lỗi của lần gửi gần nhất.
  let thongDiepLoi = "";

  if (taoSanPham.isError === true) {
    thongDiepLoi = layThongBaoLoi(taoSanPham.error);
  }

  return (
    <div>
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link to="/admin/products">Sản phẩm</Link>
        <ChevronRight size={14} />
        <span>Thêm sản phẩm</span>
      </nav>

      <div className="panel__head">
        <div>
          <p className="eyebrow-free">Catalog</p>
          <h1>Thêm sản phẩm</h1>
          <p>
            Tạo thông tin chung và biến thể đầu tiên. Sau khi lưu, bạn có
            thể thêm biến thể màu/size và tải ảnh ở trang chi tiết.
          </p>
        </div>
      </div>

      <BieuMauSanPhamQuanTri
        mode="create"
        basePath="/admin/products"
        onSubmit={xuLyGuiSanPham}
        isPending={taoSanPham.isPending}
        error={thongDiepLoi}
      />
    </div>
  );
}
