import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useCayDanhMuc } from "../../hooks/useCategoryTree.js";
import { useSoLuongMatHangTrongGio } from "../../hooks/useCartItemCount.js";
import { xoaPhienDangNhap } from "../../lib/authStorage.js";

// Thanh điều hướng chỉ có một dòng, nên rút gọn phần sau dấu "&".
// Ví dụ: "Điện thoại & Phụ kiện" trở thành "Điện thoại".
function rutGonTenDanhMuc(tenDanhMuc) {
  // Nếu tên danh mục không phải chuỗi thì trả về chuỗi rỗng để an toàn.
  if (typeof tenDanhMuc !== "string") {
    return "";
  }

  // Biến này lưu các phần của tên danh mục sau khi tách theo dấu "&".
  const cacPhanTen = tenDanhMuc.split("&");

  // Biến này lưu phần đầu tiên của tên danh mục.
  const phanDauTien = cacPhanTen[0];

  return phanDauTien.trim();
}

// Thành phần này hiển thị đầu trang gồm menu di động, thương hiệu,
// ô tìm kiếm, các liên kết tài khoản, đơn hàng, giỏ hàng và thanh danh mục.
export default function DauTrangCuaHang() {
  // useNavigate trả về một hàm dùng để chuyển trang bằng mã lệnh.
  const hamDieuHuong = useNavigate();

  // Hook này trả về trạng thái đăng nhập hiện tại của người dùng.
  const trangThaiDangNhap = useAuth();

  // Biến này cho biết người dùng đã đăng nhập hay chưa.
  const daDangNhap = trangThaiDangNhap.daDangNhap;

  // Biến này lưu thông tin người dùng đang đăng nhập.
  const nguoiDungDangNhap = trangThaiDangNhap.nguoiDung;

  // Biến này lưu tên hiển thị trên phần tài khoản.
  let tenNguoiDung = "Tài khoản";

  if (nguoiDungDangNhap !== null) {
    // Biến này cho biết đã tìm được tên hiển thị từ họ tên hay chưa.
    let daCoTenHienThi = false;

    if (typeof nguoiDungDangNhap.fullName === "string") {
      if (nguoiDungDangNhap.fullName.trim() !== "") {
        tenNguoiDung = nguoiDungDangNhap.fullName;
        daCoTenHienThi = true;
      }
    }

    // Nếu họ tên trống thì dùng email để người dùng vẫn nhận ra tài khoản.
    if (daCoTenHienThi === false) {
      if (typeof nguoiDungDangNhap.email === "string") {
        if (nguoiDungDangNhap.email !== "") {
          tenNguoiDung = nguoiDungDangNhap.email;
        }
      }
    }
  }

  // Biến này cho biết tài khoản đang đăng nhập có vai trò quản trị hay không.
  let laQuanTriVien = false;

  if (nguoiDungDangNhap !== null) {
    if (nguoiDungDangNhap.role === "ADMIN") {
      laQuanTriVien = true;
    }
  }

  // useLocation trả về thông tin về đường dẫn hiện tại.
  const thongTinDuongDan = useLocation();

  // useSearchParams trả về một mảng gồm tham số tìm kiếm và hàm cập nhật.
  const capThamSoTimKiem = useSearchParams();

  // Biến này lưu bộ tham số tìm kiếm hiện tại trên đường dẫn.
  const thamSoTimKiem = capThamSoTimKiem[0];

  // Biến này lưu từ khoá ban đầu lấy từ tham số q trên đường dẫn.
  let tuKhoaBanDau = "";
  const tuKhoaTrenDuongDan = thamSoTimKiem.get("q");

  // Nếu đường dẫn có tham số q thì dùng giá trị đó.
  if (tuKhoaTrenDuongDan !== null) {
    tuKhoaBanDau = tuKhoaTrenDuongDan;
  }

  // useState tạo một giá trị trạng thái và trả về mảng gồm giá trị và hàm cập nhật.
  const trangThaiTuKhoa = useState(tuKhoaBanDau);

  // Biến này lưu từ khoá tìm kiếm đang hiển thị trong ô nhập.
  const tuKhoaTimKiem = trangThaiTuKhoa[0];

  // Biến này lưu hàm dùng để cập nhật từ khoá tìm kiếm.
  const capNhatTuKhoaTimKiem = trangThaiTuKhoa[1];

  // Trạng thái này cho biết menu di động đang mở hay đóng.
  const trangThaiMenuDiDong = useState(false);

  // Biến này lưu trạng thái mở của menu di động.
  const menuDiDongDangMo = trangThaiMenuDiDong[0];

  // Biến này lưu hàm dùng để cập nhật trạng thái menu di động.
  const capNhatMenuDiDong = trangThaiMenuDiDong[1];

  // Hook này gọi API lấy cây danh mục từ backend.
  const ketQuaCayDanhMuc = useCayDanhMuc();

  // Hook này trả về tổng số mặt hàng đang có trong giỏ của người dùng.
  const soLuongMatHangTrongGio = useSoLuongMatHangTrongGio();

  // Biến này lưu cây danh mục sau khi kiểm tra dữ liệu trả về.
  let cayDanhMuc = [];
  const duLieuCayDanhMuc = ketQuaCayDanhMuc.data;

  // Nếu dữ liệu trả về là một mảng thì mới dùng được.
  if (duLieuCayDanhMuc !== undefined) {
    if (Array.isArray(duLieuCayDanhMuc) === true) {
      cayDanhMuc = duLieuCayDanhMuc;
    }
  }

  // Chỉ hiển thị tối đa sáu danh mục trên thanh điều hướng.
  const danhSachDanhMucDieuHuong = cayDanhMuc.slice(0, 6);

  // Biến này lưu slug danh mục đang được chọn trên đường dẫn.
  const slugDanhMucDangChon = thamSoTimKiem.get("category");

  // Biến này cho biết người dùng đang ở trang danh sách sản phẩm hay không.
  let dangODanhSachSanPham = false;
  if (thongTinDuongDan.pathname === "/products") {
    dangODanhSachSanPham = true;
  }

  // Biến này cho biết có danh mục nào đang được chọn hay không.
  let coDanhMucDangChon = false;
  if (slugDanhMucDangChon !== null) {
    if (slugDanhMucDangChon !== "") {
      coDanhMucDangChon = true;
    }
  }

  // Hàm này xử lý khi người dùng gửi ô tìm kiếm.
  function xuLyGuiTimKiem(suKienGui) {
    suKienGui.preventDefault();

    // Biến này lưu từ khoá sau khi bỏ khoảng trắng ở hai đầu.
    const tuKhoaDaCat = tuKhoaTimKiem.trim();

    // Mặc định mở trang danh sách sản phẩm.
    let duongDanCanMo = "/products";

    // Nếu có từ khoá thì thêm từ khoá đã mã hoá vào đường dẫn.
    if (tuKhoaDaCat !== "") {
      const tuKhoaDaMaHoa = encodeURIComponent(tuKhoaDaCat);
      duongDanCanMo = "/products?q=" + tuKhoaDaMaHoa;
    }

    hamDieuHuong(duongDanCanMo);
    capNhatMenuDiDong(false);
  }

  // Hàm này cập nhật từ khoá mỗi khi người dùng nhập.
  function xuLyThayDoiTuKhoa(suKienNhap) {
    capNhatTuKhoaTimKiem(suKienNhap.target.value);
  }

  // Hàm này đồng bộ trạng thái menu khi thẻ details mở hoặc đóng.
  function xuLyMoDongMenuDiDong(suKienMoDong) {
    capNhatMenuDiDong(suKienMoDong.currentTarget.open);
  }

  // Hàm này đóng menu di động sau khi người dùng chọn một liên kết.
  function dongMenuDiDong() {
    capNhatMenuDiDong(false);
  }

  // Hàm này xoá phiên đăng nhập; sự kiện đổi phiên sẽ xoá toàn bộ cache dữ liệu.
  function xuLyDangXuat() {
    xoaPhienDangNhap();
    capNhatMenuDiDong(false);
    hamDieuHuong("/");
  }

  // Mảng này lưu các liên kết danh mục trong menu di động.
  const cacLienKetDanhMucDiDong = [];

  // Tạo từng liên kết danh mục cho menu di động.
  for (const danhMuc of danhSachDanhMucDieuHuong) {
    const duongDanDanhMuc =
      "/products?category=" + encodeURIComponent(danhMuc.slug);

    cacLienKetDanhMucDiDong.push(
      <Link
        key={danhMuc.id}
        to={duongDanDanhMuc}
        onClick={dongMenuDiDong}
      >
        {danhMuc.name}
      </Link>,
    );
  }

  // Mảng này lưu các liên kết danh mục trên thanh điều hướng chính.
  const cacLienKetDanhMucChinh = [];

  // Tạo từng liên kết danh mục cho thanh điều hướng chính.
  for (const danhMuc of danhSachDanhMucDieuHuong) {
    // Biến này cho biết danh mục hiện tại có đang được chọn hay không.
    let laDanhMucDangChon = false;
    if (slugDanhMucDangChon === danhMuc.slug) {
      laDanhMucDangChon = true;
    }

    // aria-current cho trình đọc màn hình biết mục nào đang được chọn.
    let giaTriAriaHienTai = undefined;
    if (laDanhMucDangChon === true) {
      giaTriAriaHienTai = "page";
    }

    const duongDanDanhMuc =
      "/products?category=" + encodeURIComponent(danhMuc.slug);

    const tenDanhMucRutGon = rutGonTenDanhMuc(danhMuc.name);

    cacLienKetDanhMucChinh.push(
      <Link
        key={danhMuc.id}
        to={duongDanDanhMuc}
        aria-current={giaTriAriaHienTai}
      >
        {tenDanhMucRutGon}
      </Link>,
    );
  }

  // Biến này lưu trạng thái aria-current của mục "Hàng mới".
  let trangHienTaiHangMoi = undefined;
  if (dangODanhSachSanPham === true) {
    if (coDanhMucDangChon === false) {
      trangHienTaiHangMoi = "page";
    }
  }

  // Phần tử này hiển thị số lượng mặt hàng trên biểu tượng giỏ hàng.
  let huyHieuGioHang = null;

  // Chỉ hiển thị huy hiệu khi giỏ hàng có ít nhất một mặt hàng.
  if (soLuongMatHangTrongGio > 0) {
    huyHieuGioHang = (
      <span className="cart-count">{soLuongMatHangTrongGio}</span>
    );
  }

  // Phần tử này hiển thị liên kết tài khoản hoặc đăng nhập trên đầu trang.
  let phanTuTaiKhoan = (
    <Link className="head-action head-action--account" to="/login">
      <UserRound className="icon" />
      <span>Đăng nhập</span>
    </Link>
  );

  if (daDangNhap === true) {
    phanTuTaiKhoan = (
      <Link className="head-action head-action--account" to="/account">
        <UserRound className="icon" />
        <span>{tenNguoiDung}</span>
      </Link>
    );
  }

  // Phần tử này hiển thị nút đăng xuất khi người dùng đã đăng nhập.
  let phanTuDangXuat = null;

  if (daDangNhap === true) {
    phanTuDangXuat = (
      <Link
        className="head-action head-action--logout"
        to="/"
        onClick={xuLyDangXuat}
      >
        <LogOut className="icon" />
        <span>Đăng xuất</span>
      </Link>
    );
  }

  // Phần tử này hiển thị liên kết tài khoản trong menu di động.
  let phanTuTaiKhoanDiDong = (
    <Link to="/login" onClick={dongMenuDiDong}>
      Đăng nhập
    </Link>
  );

  if (daDangNhap === true) {
    phanTuTaiKhoanDiDong = (
      <Link to="/account" onClick={dongMenuDiDong}>
        Tài khoản
      </Link>
    );
  }

  // Phần tử này hiển thị liên kết đăng xuất trong menu di động.
  let phanTuDangXuatDiDong = null;

  if (daDangNhap === true) {
    phanTuDangXuatDiDong = (
      <Link to="/" onClick={xuLyDangXuat}>
        Đăng xuất
      </Link>
    );
  }

  // Phần tử này hiển thị liên kết vào khu vực quản trị trên đầu trang.
  let phanTuQuanTri = null;

  if (laQuanTriVien === true) {
    phanTuQuanTri = (
      <Link className="head-action head-action--admin" to="/admin">
        <ShieldCheck className="icon" />
        <span>Quản trị</span>
      </Link>
    );
  }

  // Phần tử này hiển thị liên kết quản trị trong menu di động.
  let phanTuQuanTriDiDong = null;

  if (laQuanTriVien === true) {
    phanTuQuanTriDiDong = (
      <Link to="/admin" onClick={dongMenuDiDong}>
        Quản trị
      </Link>
    );
  }

  return (
    <header className="site-head">
      <div className="container">
        <div className="head-main">
          <details
            className="mobile-nav"
            open={menuDiDongDangMo}
            onToggle={xuLyMoDongMenuDiDong}
          >
            <summary className="menu-toggle" aria-label="Mở menu">
              <Menu className="icon" />
            </summary>
            <nav className="mobile-nav__panel" aria-label="Danh mục di động">
              <Link to="/products" onClick={dongMenuDiDong}>
                Hàng mới
              </Link>
              {cacLienKetDanhMucDiDong}
              <div className="mobile-nav__utility">
                {phanTuTaiKhoanDiDong}
                {phanTuQuanTriDiDong}
                <Link to="/orders" onClick={dongMenuDiDong}>
                  Đơn hàng
                </Link>
                {phanTuDangXuatDiDong}
              </div>
            </nav>
          </details>

          <Link className="brand" to="/" aria-label="MarketHub, trang chủ">
            <span className="brand__name">MarketHub</span>
            <span className="brand__sub">Cửa hàng chính thức</span>
          </Link>

          <form
            className="head-search"
            role="search"
            onSubmit={xuLyGuiTimKiem}
          >
            <label className="sr-only" htmlFor="storefront-search">
              Tìm sản phẩm
            </label>
            <input
              id="storefront-search"
              type="search"
              value={tuKhoaTimKiem}
              onChange={xuLyThayDoiTuKhoa}
              placeholder="Tìm sản phẩm, danh mục…"
              autoComplete="off"
            />
            <button type="submit" aria-label="Tìm kiếm">
              <Search className="icon" />
            </button>
          </form>

          <div className="head-actions">
            {phanTuQuanTri}
            {phanTuTaiKhoan}
            <Link className="head-action head-action--orders" to="/orders">
              <Package className="icon" />
              <span>Đơn hàng</span>
            </Link>
            <Link className="head-action" to="/cart">
              <ShoppingBag className="icon" />
              <span>Giỏ</span>
              {huyHieuGioHang}
            </Link>
            {phanTuDangXuat}
          </div>
        </div>
      </div>

      <div className="nav-bar">
        <div className="container nav-bar__inner">
          <nav className="nav-list" aria-label="Danh mục sản phẩm">
            <Link to="/products" aria-current={trangHienTaiHangMoi}>
              Hàng mới
            </Link>
            {cacLienKetDanhMucChinh}
          </nav>
          <span className="nav-note">Giao toàn quốc · Đổi trả 30 ngày</span>
        </div>
      </div>
    </header>
  );
}
