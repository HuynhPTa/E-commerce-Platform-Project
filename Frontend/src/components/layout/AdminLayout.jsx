import { useEffect } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Package,
  ShieldCheck,
  ShieldX,
  Store,
  Users,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useHoSoCaNhan } from "../../hooks/useProfile.js";
import {
  layChuVietTat,
  layTenHienThi,
} from "../../lib/adminHelpers.js";
import { xoaPhienDangNhap } from "../../lib/authStorage.js";

// Mảng này khai báo các mục điều hướng trong khu vực quản trị.
const CAC_MUC_QUAN_TRI = [
  {
    duongDan: "/admin",
    nhan: "Tổng quan",
    bieuTuong: LayoutDashboard,
    chinhXac: true,
  },
  {
    duongDan: "/admin/categories",
    nhan: "Danh mục",
    bieuTuong: FolderTree,
    chinhXac: false,
  },
  {
    duongDan: "/admin/products",
    nhan: "Sản phẩm",
    bieuTuong: Package,
    chinhXac: false,
  },
  {
    duongDan: "/admin/orders",
    nhan: "Đơn hàng",
    bieuTuong: ClipboardList,
    chinhXac: false,
  },
  {
    duongDan: "/admin/users",
    nhan: "Người dùng",
    bieuTuong: Users,
    chinhXac: false,
  },
];

// Hàm này trả về tiêu đề ngắn của khu vực đang mở.
function layTieuDeKhuVuc(duongDan) {
  if (duongDan === "/admin") {
    return "Tổng quan";
  }

  if (duongDan.startsWith("/admin/categories") === true) {
    return "Danh mục";
  }

  if (duongDan === "/admin/products/new") {
    return "Thêm sản phẩm";
  }

  if (duongDan.startsWith("/admin/products/") === true) {
    return "Chi tiết sản phẩm";
  }

  if (duongDan.startsWith("/admin/products") === true) {
    return "Sản phẩm";
  }

  if (duongDan.startsWith("/admin/orders") === true) {
    return "Đơn hàng";
  }

  if (duongDan.startsWith("/admin/users") === true) {
    return "Người dùng";
  }

  return "Quản trị";
}

// Hàm này kiểm tra lỗi hồ sơ có phải do phiên đăng nhập hết hạn hay không.
function laLoiHetPhien(loi) {
  if (loi === null) {
    return false;
  }

  if (loi === undefined) {
    return false;
  }

  const phanHoi = loi.response;

  if (phanHoi === null) {
    return false;
  }

  if (phanHoi === undefined) {
    return false;
  }

  if (phanHoi.status === 401) {
    return true;
  }

  return false;
}

// Thành phần này hiển thị khung chung cho mọi trang quản trị.
export default function KhungQuanTri() {
  const thongTinDuongDan = useLocation();
  const hamDieuHuong = useNavigate();
  const boQuanLyTruyVan = useQueryClient();

  // Hook này trả về trạng thái đăng nhập đang lưu trong trình duyệt.
  const trangThaiDangNhap = useAuth();

  // Biến này cho biết người dùng đã có token đăng nhập hay chưa.
  const daDangNhap = trangThaiDangNhap.daDangNhap;

  // Hook này xác thực lại hồ sơ và vai trò với backend.
  const ketQuaHoSo = useHoSoCaNhan(daDangNhap);

  // Biến này lưu đường dẫn đầy đủ của trang đang mở.
  const duongDanHienTai =
    thongTinDuongDan.pathname + thongTinDuongDan.search;

  // Biến này lưu đường dẫn đăng nhập kèm địa chỉ quay lại.
  const duongDanDangNhap =
    "/login?redirect=" + encodeURIComponent(duongDanHienTai);

  // Hàm này đăng xuất và đưa người dùng về trang đăng nhập.
  function xuLyDangXuat() {
    xoaPhienDangNhap();
    boQuanLyTruyVan.clear();
    hamDieuHuong(duongDanDangNhap, { replace: true });
  }

  // Nếu phiên đã hết hạn thì xoá phiên cũ và quay lại trang đăng nhập.
  useEffect(
    function () {
      if (ketQuaHoSo.isError === false) {
        return;
      }

      if (laLoiHetPhien(ketQuaHoSo.error) === false) {
        return;
      }

      xoaPhienDangNhap();
      boQuanLyTruyVan.clear();
      hamDieuHuong(duongDanDangNhap, { replace: true });
    },
    [
      ketQuaHoSo.isError,
      ketQuaHoSo.error,
      boQuanLyTruyVan,
      hamDieuHuong,
      duongDanDangNhap,
    ],
  );

  if (daDangNhap === false) {
    return <Navigate to={duongDanDangNhap} replace />;
  }

  if (ketQuaHoSo.isLoading === true) {
    return (
      <div className="admin-gate">
        <div className="admin-state">
          <LoaderCircle className="spin" size={24} />
          <span>Đang xác thực quyền quản trị…</span>
        </div>
      </div>
    );
  }

  if (ketQuaHoSo.isError === true) {
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <ShieldX size={38} />
          <h1>Không xác thực được phiên đăng nhập</h1>
          <p>
            Phiên đăng nhập có thể đã hết hạn hoặc máy chủ không phản hồi.
            Vui lòng đăng nhập lại để tiếp tục.
          </p>
          <div className="btn-row admin-gate__actions">
            <Link className="btn btn--primary" to={duongDanDangNhap}>
              Đăng nhập lại
            </Link>
            <Link className="btn" to="/">
              Về cửa hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Biến này lưu hồ sơ người dùng do backend trả về.
  const hoSo = ketQuaHoSo.data;

  // Biến này cho biết tài khoản hiện tại có vai trò quản trị hay không.
  let laQuanTriVien = false;

  if (hoSo !== null) {
    if (hoSo !== undefined) {
      if (hoSo.role === "ADMIN") {
        laQuanTriVien = true;
      }
    }
  }

  if (laQuanTriVien === false) {
    // Hàm này đăng xuất tài khoản hiện tại để đăng nhập bằng tài khoản khác.
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <ShieldX size={38} />
          <h1>Không có quyền truy cập</h1>
          <p>
            Khu vực này chỉ dành cho tài khoản quản trị viên. Bạn đang đăng
            nhập bằng một tài khoản người mua.
          </p>
          <div className="btn-row admin-gate__actions">
            <button
              className="btn btn--primary"
              type="button"
              onClick={xuLyDangXuat}
            >
              Đăng nhập tài khoản khác
            </button>
            <Link className="btn" to="/">
              Về cửa hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Mảng này lưu giao diện các liên kết điều hướng.
  const cacLienKetDieuHuong = [];

  for (const mucQuanTri of CAC_MUC_QUAN_TRI) {
    const ThanhPhanBieuTuong = mucQuanTri.bieuTuong;

    cacLienKetDieuHuong.push(
      <NavLink
        className="panel__link"
        key={mucQuanTri.duongDan}
        to={mucQuanTri.duongDan}
        end={mucQuanTri.chinhXac}
      >
        <ThanhPhanBieuTuong className="icon icon--sm" />
        <span>{mucQuanTri.nhan}</span>
      </NavLink>,
    );
  }

  const tenHienThi = layTenHienThi(hoSo);
  const chuVietTat = layChuVietTat(hoSo);
  const tieuDeKhuVuc = layTieuDeKhuVuc(thongTinDuongDan.pathname);

  return (
    <div className="panel">
      <aside className="panel__side">
        <Link className="panel__brand brand" to="/admin">
          <span className="brand__name">MarketHub</span>
          <span className="brand__sub">Bảng quản trị cửa hàng</span>
        </Link>

        <nav className="panel__nav" aria-label="Điều hướng quản trị">
          <span className="panel__label">Quản trị</span>
          {cacLienKetDieuHuong}
        </nav>

        <div className="panel__foot">
          <ShieldCheck size={15} className="icon icon--sm" />
          <span> Khu vực chỉ dành cho quản trị viên</span>
        </div>
      </aside>

      <div className="panel__main">
        <header className="panel__top">
          <div className="panel__top-left">
            <span>Quản trị</span>
            <span aria-hidden="true">/</span>
            <strong>{tieuDeKhuVuc}</strong>
          </div>
          <div className="panel__top-right">
            <Link className="btn btn--ghost btn--sm" to="/products">
              <Store size={15} /> Về cửa hàng
            </Link>
            <span className="user-chip">
              <span className="user-chip__avatar">{chuVietTat}</span>
              <span className="user-chip__name">{tenHienThi}</span>
            </span>
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              onClick={xuLyDangXuat}
            >
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>
        </header>

        <main className="panel__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
