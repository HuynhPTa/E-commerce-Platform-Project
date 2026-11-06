import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  CircleCheck,
  ExternalLink,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import BieuMauSanPhamQuanTri from "../../components/admin/ProductForm";
import QuanLyBienTheQuanTri from "../../components/admin/VariantManager";
import QuanLyAnhQuanTri from "../../components/admin/ImageManager";
import {
  useCapNhatSanPhamQuanTri,
  useChiTietSanPhamQuanTri,
} from "../../hooks/useAdminProducts";
import {
  dinhDangNgayDayDu,
  layThongBaoLoi,
} from "../../lib/adminHelpers";

// Thành phần này hiển thị trang chi tiết và chỉnh sửa sản phẩm.
export default function TrangChiTietSanPhamQuanTri() {
  const thamSoDuongDan = useParams();
  const maSanPham = thamSoDuongDan.productId;
  const ketQuaSanPham = useChiTietSanPhamQuanTri(maSanPham);
  const capNhatSanPham = useCapNhatSanPhamQuanTri();

  if (ketQuaSanPham.isLoading === true) {
    return (
      <div className="admin-state">
        <LoaderCircle className="spin" size={24} />
        <span>Đang tải sản phẩm…</span>
      </div>
    );
  }

  if (ketQuaSanPham.isError === true) {
    return (
      <div className="admin-state">
        <TriangleAlert size={34} />
        <h1>Không tìm thấy sản phẩm</h1>
        <p>Sản phẩm không tồn tại hoặc đã bị xoá.</p>
        <Link className="btn btn--primary" to="/admin/products">
          Về danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const sanPham = ketQuaSanPham.data;

  if (sanPham === null) {
    return (
      <div className="admin-state">
        <TriangleAlert size={34} />
        <h1>Không tìm thấy sản phẩm</h1>
        <p>Sản phẩm không tồn tại hoặc đã bị xoá.</p>
        <Link className="btn btn--primary" to="/admin/products">
          Về danh sách sản phẩm
        </Link>
      </div>
    );
  }

  // Biến này cho biết sản phẩm đã bị xoá mềm hay chưa.
  const daBiXoa = sanPham.status === "DELETED";

  // Hàm này gửi thông tin chung của sản phẩm lên backend.
  function xuLyGuiSanPham(giaTri) {
    // Biến này lưu mô tả sau khi bỏ khoảng trắng hai đầu.
    let moTa = null;

    if (giaTri.description !== "") {
      moTa = giaTri.description;
    }

    capNhatSanPham.mutate({
      productId: sanPham.id,
      name: giaTri.name,
      description: moTa,
      categoryId: giaTri.categoryId,
    });
  }

  // Biến này lưu nhãn trạng thái của sản phẩm.
  let nhanTrangThai = "Đang bán";
  let lopTrangThai = "status status--completed";

  if (daBiXoa === true) {
    nhanTrangThai = "Đã xoá";
    lopTrangThai = "status status--muted";
  }

  // Biến này lưu tên danh mục hiển thị.
  let tenDanhMuc = "Chưa phân loại";

  if (typeof sanPham.categoryName === "string") {
    if (sanPham.categoryName !== "") {
      tenDanhMuc = sanPham.categoryName;
    }
  }

  // Phần tử này hiển thị cảnh báo khi sản phẩm đã bị xoá mềm.
  let phanTuCanhBaoXoa = null;

  if (daBiXoa === true) {
    phanTuCanhBaoXoa = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>
          <strong>Sản phẩm đã bị xoá mềm</strong>
          <div>
            Không thể chỉnh sửa, thêm biến thể hay tải ảnh. Sản phẩm cũng
            không còn hiển thị với người mua.
          </div>
        </div>
      </div>
    );
  }

  // Phần tử này hiển thị thông báo lưu thành công.
  let phanTuThanhCong = null;

  if (capNhatSanPham.isSuccess === true) {
    if (daBiXoa === false) {
      phanTuThanhCong = (
        <div className="alert alert--success" role="status">
          <CircleCheck size={18} />
          <div>Đã lưu thay đổi thông tin sản phẩm.</div>
        </div>
      );
    }
  }

  // Phần tử này hiển thị lỗi khi lưu sản phẩm.
  let phanTuLoi = null;

  if (capNhatSanPham.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(capNhatSanPham.error)}</div>
      </div>
    );
  }

  // Phần tử này hiển thị liên kết xem sản phẩm trên cửa hàng.
  let phanTuXemCuaHang = null;

  if (daBiXoa === false) {
    phanTuXemCuaHang = (
      <Link
        className="btn btn--sm"
        to={"/products/" + sanPham.id}
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink size={14} /> Xem trên cửa hàng
      </Link>
    );
  }

  return (
    <div>
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link to="/admin/products">Sản phẩm</Link>
        <ChevronRight size={14} />
        <span>{sanPham.name}</span>
      </nav>

      <div className="panel__head">
        <div>
          <p className="eyebrow-free">Catalog</p>
          <h1>{sanPham.name}</h1>
          <div className="admin-meta-row">
            <span className={lopTrangThai}>{nhanTrangThai}</span>
            <span className="cell-sub">
              #{sanPham.id} · {tenDanhMuc} · Tạo ngày{" "}
              {dinhDangNgayDayDu(sanPham.createdAt)}
            </span>
          </div>
        </div>
        <div className="panel__head-actions">{phanTuXemCuaHang}</div>
      </div>

      <div className="admin-page-stack">
        {phanTuCanhBaoXoa}
        {phanTuThanhCong}
        {phanTuLoi}

        <BieuMauSanPhamQuanTri
          key={sanPham.id}
          mode="edit"
          basePath="/admin/products"
          product={sanPham}
          onSubmit={xuLyGuiSanPham}
          isPending={capNhatSanPham.isPending}
          disabled={daBiXoa}
        />

        <QuanLyBienTheQuanTri
          key={"variants-" + sanPham.id}
          product={sanPham}
          disabled={daBiXoa}
        />

        <QuanLyAnhQuanTri
          key={"images-" + sanPham.id}
          product={sanPham}
          disabled={daBiXoa}
        />
      </div>
    </div>
  );
}
