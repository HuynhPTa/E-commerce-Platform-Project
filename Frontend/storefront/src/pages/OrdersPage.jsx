import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ImageOff,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useDanhSachDonHang } from "../hooks/useOrders.js";
import { taoDuongDanTaiNguyen } from "../lib/assetUrl.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import { dinhDangTien } from "../lib/formatMoney.js";
import {
  dinhDangNgayGio,
  layLopTrangThaiDonHang,
  layNhanPhuongThucThanhToan,
  layNhanTrangThaiDonHang,
  taoChuoiThuocTinh,
} from "../lib/orderFormat.js";

// Tiêu đề mặc định của tài liệu khi rời trang đơn hàng.
const TIEU_DE_MAC_DINH = "Tất cả sản phẩm | MarketHub";

// Danh sách này khai báo các tab lọc đơn hàng theo trạng thái.
const CAC_TRANG_THAI_LOC = [
  { giaTri: "", nhan: "Tất cả" },
  { giaTri: "PENDING", nhan: "Chờ xác nhận" },
  { giaTri: "CONFIRMED", nhan: "Đã xác nhận" },
  { giaTri: "SHIPPING", nhan: "Đang giao" },
  { giaTri: "DELIVERED", nhan: "Đã giao" },
  { giaTri: "COMPLETED", nhan: "Hoàn tất" },
  { giaTri: "CANCELLED", nhan: "Đã huỷ" },
];

// Hàm này kiểm tra lỗi trả về có phải do phiên đăng nhập đã hết hạn hay không.
function kiemTraLaLoiHetPhien(loi) {
  if (loi === undefined) {
    return false;
  }

  if (loi === null) {
    return false;
  }

  if (loi.response !== undefined) {
    if (loi.response !== null) {
      if (loi.response.status === 401) {
        return true;
      }
    }
  }

  return false;
}

// Thành phần này hiển thị ảnh nhỏ của một mặt hàng trong thẻ đơn.
function AnhXemTruocDonHang(thuocTinh) {
  // Biến này lưu dữ liệu mặt hàng do thành phần cha truyền xuống.
  const matHang = thuocTinh.matHang;

  // useState tạo trạng thái cho biết ảnh sản phẩm có bị lỗi tải hay không.
  const trangThaiLoiAnh = useState(false);

  // Biến này cho biết ảnh sản phẩm đang bị lỗi hay không.
  const coLoiAnh = trangThaiLoiAnh[0];

  // Biến này lưu hàm cập nhật trạng thái lỗi ảnh.
  const capNhatCoLoiAnh = trangThaiLoiAnh[1];

  // Hàm này đánh dấu ảnh sản phẩm đã bị lỗi tải.
  function xuLyLoiAnh() {
    capNhatCoLoiAnh(true);
  }

  // Biến này lưu đường dẫn đầy đủ của ảnh sản phẩm.
  const duongDanAnhSanPham = taoDuongDanTaiNguyen(matHang.thumbnailUrl);

  // Nếu không có ảnh dùng được thì hiển thị biểu tượng thay thế.
  if (duongDanAnhSanPham === null) {
    return (
      <span className="product-media__fallback">
        <ImageOff size={18} />
      </span>
    );
  }

  // Nếu ảnh đã từng bị lỗi thì hiển thị biểu tượng thay thế.
  if (coLoiAnh === true) {
    return (
      <span className="product-media__fallback">
        <ImageOff size={18} />
      </span>
    );
  }

  return (
    <img
      src={duongDanAnhSanPham}
      alt={matHang.productName}
      loading="lazy"
      onError={xuLyLoiAnh}
    />
  );
}

// Thành phần này hiển thị trang danh sách đơn hàng của cửa hàng.
export default function TrangDonHang() {
  // useAuth trả về trạng thái đăng nhập hiện tại.
  const trangThaiDangNhap = useAuth();

  // Biến này cho biết người dùng đã đăng nhập hay chưa.
  const daDangNhap = trangThaiDangNhap.daDangNhap;

  // Trạng thái này lưu trạng thái đơn hàng đang được lọc.
  const trangThaiBoLoc = useState("");

  // Biến này lưu trạng thái đơn hàng đang được lọc.
  const trangThaiDangLoc = trangThaiBoLoc[0];

  // Biến này lưu hàm cập nhật trạng thái đang lọc.
  const capNhatTrangThaiDangLoc = trangThaiBoLoc[1];

  // Trạng thái này lưu số trang đơn hàng hiện tại.
  const trangThaiSoTrang = useState(1);

  // Biến này lưu số trang hiện tại.
  const soTrangHienTai = trangThaiSoTrang[0];

  // Biến này lưu hàm cập nhật số trang hiện tại.
  const capNhatSoTrangHienTai = trangThaiSoTrang[1];

  // Hook này gọi API lấy danh sách đơn hàng theo bộ lọc và số trang.
  const ketQuaDonHang = useDanhSachDonHang(
    daDangNhap,
    trangThaiDangLoc,
    soTrangHienTai,
  );

  // Hàm này cập nhật tiêu đề tài liệu khi mở trang đơn hàng.
  function xuLyCapNhatTieuDeTaiLieu() {
    document.title = "Đơn hàng của tôi | MarketHub";

    // Hàm này khôi phục tiêu đề mặc định khi rời trang.
    function xuLyKhoiPhucTieuDe() {
      document.title = TIEU_DE_MAC_DINH;
    }

    return xuLyKhoiPhucTieuDe;
  }

  // useEffect cập nhật tiêu đề tài liệu sau khi trang được gắn vào giao diện.
  useEffect(xuLyCapNhatTieuDeTaiLieu, []);

  // Hàm này xử lý khi người dùng chọn một tab lọc trạng thái.
  function xuLyChonBoLoc(suKienBam) {
    const giaTriBoLoc = suKienBam.currentTarget.value;
    capNhatTrangThaiDangLoc(giaTriBoLoc);
    capNhatSoTrangHienTai(1);
  }

  // Hàm này đưa danh sách đơn hàng về trang trước.
  function xuLyVeTrangTruoc() {
    if (soTrangHienTai > 1) {
      capNhatSoTrangHienTai(soTrangHienTai - 1);
    }
  }

  // Hàm này đưa danh sách đơn hàng sang trang sau.
  function xuLySangTrangSau() {
    // Biến này lưu tổng số trang thật do backend trả về.
    let tongSoTrang = 1;
    const duLieuDonHang = ketQuaDonHang.data;

    if (duLieuDonHang !== undefined) {
      if (duLieuDonHang !== null) {
        const soTrangTuBackend = Number(duLieuDonHang.totalPages);

        if (Number.isFinite(soTrangTuBackend) === true) {
          if (soTrangTuBackend > 0) {
            tongSoTrang = soTrangTuBackend;
          }
        }
      }
    }

    if (soTrangHienTai < tongSoTrang) {
      capNhatSoTrangHienTai(soTrangHienTai + 1);
    }
  }

  // Hàm này chuyển danh sách đơn hàng tới một trang cụ thể.
  function xuLyChonTrang(soTrangMoi) {
    capNhatSoTrangHienTai(soTrangMoi);
  }

  // Hàm này tạo lại yêu cầu tải danh sách đơn hàng khi người dùng bấm thử lại.
  function xuLyThuLaiDonHang() {
    ketQuaDonHang.refetch();
  }

  // Biến này lưu danh sách đơn hàng sau khi kiểm tra dữ liệu trả về.
  let danhSachDonHang = [];

  // Biến này lưu tổng số đơn hàng của bộ lọc hiện tại.
  let tongSoDonHang = 0;

  // Biến này lưu tổng số trang của bộ lọc hiện tại.
  let tongSoTrangDonHang = 1;

  // Biến này lưu số trang hiện tại do backend trả về.
  let soTrangTuBackend = 1;

  const duLieuDonHang = ketQuaDonHang.data;

  // Nếu dữ liệu trả về là một đối tượng thì mới đọc các trường bên trong.
  if (duLieuDonHang !== undefined) {
    if (duLieuDonHang !== null) {
      if (Array.isArray(duLieuDonHang.items) === true) {
        danhSachDonHang = duLieuDonHang.items;
      }

      const tongSoDonTuBackend = Number(duLieuDonHang.totalItems);

      if (Number.isFinite(tongSoDonTuBackend) === true) {
        tongSoDonHang = tongSoDonTuBackend;
      }

      const tongSoTrangTuBackend = Number(duLieuDonHang.totalPages);

      if (Number.isFinite(tongSoTrangTuBackend) === true) {
        if (tongSoTrangTuBackend > 0) {
          tongSoTrangDonHang = tongSoTrangTuBackend;
        }
      }

      const soTrangHienTaiTuBackend = Number(duLieuDonHang.page);

      if (Number.isFinite(soTrangHienTaiTuBackend) === true) {
        if (soTrangHienTaiTuBackend > 0) {
          soTrangTuBackend = soTrangHienTaiTuBackend;
        }
      }
    }
  }

  // Mảng này lưu các tab lọc trạng thái đơn hàng.
  const cacTabLoc = [];

  // Tạo từng tab lọc từ danh sách trạng thái đã khai báo.
  for (const trangThaiLoc of CAC_TRANG_THAI_LOC) {
    // Biến này cho biết tab hiện tại có đang được chọn hay không.
    let dangDuocChon = false;

    if (trangThaiDangLoc === trangThaiLoc.giaTri) {
      dangDuocChon = true;
    }

    // Biến này lưu giá trị aria-current của tab đang xét.
    let giaTriAriaCurrent = "false";

    if (dangDuocChon === true) {
      giaTriAriaCurrent = "page";
    }

    cacTabLoc.push(
      <button
        className="filter-tab"
        type="button"
        key={trangThaiLoc.giaTri}
        value={trangThaiLoc.giaTri}
        onClick={xuLyChonBoLoc}
        aria-current={giaTriAriaCurrent}
      >
        {trangThaiLoc.nhan}
      </button>,
    );
  }

  // Mảng này lưu các thẻ đơn hàng.
  const cacTheDonHang = [];

  // Tạo từng thẻ đơn hàng từ dữ liệu thật của backend.
  for (const donHang of danhSachDonHang) {
    // Mảng này lưu các dòng xem trước mặt hàng trong đơn.
    const cacDongXemTruoc = [];

    if (Array.isArray(donHang.previewItems) === true) {
      for (const matHang of donHang.previewItems) {
        // Biến này lưu mô tả thuộc tính và số lượng của mặt hàng.
        let nhanBienThe = "SL " + matHang.quantity;
        const chuoiThuocTinh = taoChuoiThuocTinh(matHang.attributes);

        if (chuoiThuocTinh !== "") {
          nhanBienThe = chuoiThuocTinh + " · SL " + matHang.quantity;
        }

        cacDongXemTruoc.push(
          <div className="order-card__item" key={matHang.id}>
            <span className="order-card__media">
              <AnhXemTruocDonHang matHang={matHang} />
            </span>
            <span>
              <span className="order-card__item-name">
                {matHang.productName}
              </span>
              <span className="order-card__item-meta">{nhanBienThe}</span>
            </span>
          </div>,
        );
      }
    }

    // Nếu backend không trả preview thì vẫn hiển thị số lượng mặt hàng.
    if (cacDongXemTruoc.length === 0) {
      cacDongXemTruoc.push(
        <div className="order-card__item" key="so-luong-mat-hang">
          <span className="order-card__item-name">
            {donHang.itemCount} sản phẩm
          </span>
        </div>,
      );
    }

    // Biến này lưu đường dẫn tới trang chi tiết của đơn hàng.
    const duongDanChiTiet = "/orders/" + donHang.id;

    cacTheDonHang.push(
      <article className="order-card" key={donHang.id}>
        <div className="order-card__head">
          <span className="order-card__id">Đơn #{donHang.id}</span>
          <span className="order-card__meta">
            <span>{dinhDangNgayGio(donHang.createdAt)}</span>
            <span>{layNhanPhuongThucThanhToan(donHang.paymentMethod)}</span>
          </span>
          <span className={layLopTrangThaiDonHang(donHang.status)}>
            {layNhanTrangThaiDonHang(donHang.status)}
          </span>
        </div>

        <div className="order-card__body">
          <div className="order-card__items">{cacDongXemTruoc}</div>
          <div className="order-card__total">
            <span>Tổng cộng</span>
            <strong>{dinhDangTien(donHang.totalMinor)}</strong>
          </div>
        </div>

        <div className="order-card__foot">
          <Link className="btn btn--sm" to={duongDanChiTiet}>
            Xem chi tiết
          </Link>
        </div>
      </article>,
    );
  }

  // Mảng này lưu các nút số trang.
  const cacNutTrang = [];

  if (tongSoTrangDonHang > 1) {
    // Biến này lưu trang bắt đầu của cửa sổ số trang đang hiển thị.
    let trangBatDau = soTrangTuBackend - 2;

    if (trangBatDau < 1) {
      trangBatDau = 1;
    }

    // Biến này lưu trang kết thúc của cửa sổ số trang đang hiển thị.
    let trangKetThuc = trangBatDau + 4;

    if (trangKetThuc > tongSoTrangDonHang) {
      trangKetThuc = tongSoTrangDonHang;
    }

    // Điều chỉnh lại trang bắt đầu để cửa sổ luôn có tối đa năm trang.
    trangBatDau = trangKetThuc - 4;

    if (trangBatDau < 1) {
      trangBatDau = 1;
    }

    // Hiển thị trang đầu tiên khi cửa sổ không bắt đầu từ trang một.
    if (trangBatDau > 1) {
      cacNutTrang.push(
        <button
          className="page-btn"
          type="button"
          key="trang-dau"
          onClick={function () {
            xuLyChonTrang(1);
          }}
        >
          1
        </button>,
      );
    }

    // Hiển thị dấu ba chấm khi còn khoảng trống trước cửa sổ.
    if (trangBatDau > 2) {
      cacNutTrang.push(
        <span className="page-btn" key="dau-ba-cham" aria-disabled="true">
          …
        </span>,
      );
    }

    // Tạo các nút cho khoảng trang đang hiển thị.
    for (let soTrang = trangBatDau; soTrang <= trangKetThuc; soTrang++) {
      // Biến này cho biết nút đang trỏ tới trang hiện tại hay không.
      let laTrangHienTai = false;

      if (soTrang === soTrangTuBackend) {
        laTrangHienTai = true;
      }

      // Biến này lưu số trang của nút để truyền vào hàm xử lý.
      const soTrangCuaNut = soTrang;

      // Biến này lưu giá trị aria-current của nút trang đang xét.
      let giaTriAriaCurrent = "false";

      if (laTrangHienTai === true) {
        giaTriAriaCurrent = "page";
      }

      cacNutTrang.push(
        <button
          className="page-btn"
          type="button"
          key={"trang-" + soTrang}
          aria-current={giaTriAriaCurrent}
          onClick={function () {
            xuLyChonTrang(soTrangCuaNut);
          }}
        >
          {soTrang}
        </button>,
      );
    }

    // Hiển thị dấu ba chấm khi còn khoảng trống sau cửa sổ.
    if (trangKetThuc < tongSoTrangDonHang - 1) {
      cacNutTrang.push(
        <span className="page-btn" key="cuoi-ba-cham" aria-disabled="true">
          …
        </span>,
      );
    }

    // Hiển thị trang cuối cùng khi cửa sổ không kết thúc ở trang cuối.
    if (trangKetThuc < tongSoTrangDonHang) {
      cacNutTrang.push(
        <button
          className="page-btn"
          type="button"
          key="trang-cuoi"
          onClick={function () {
            xuLyChonTrang(tongSoTrangDonHang);
          }}
        >
          {tongSoTrangDonHang}
        </button>,
      );
    }
  }

  // Phần tử này hiển thị nội dung chính theo trạng thái của trang.
  let noiDungChinh;

  // Nếu chưa đăng nhập thì yêu cầu đăng nhập trước khi xem đơn hàng.
  if (daDangNhap === false) {
    noiDungChinh = (
      <div className="catalog-state">
        <h2>Đăng nhập để xem đơn hàng</h2>
        <p>Danh sách đơn hàng được gắn với tài khoản MarketHub của bạn.</p>
        <Link className="btn btn--primary" to="/login?redirect=/orders">
          Đăng nhập
        </Link>
      </div>
    );
  } else if (ketQuaDonHang.isLoading === true) {
    noiDungChinh = (
      <div className="catalog-state" role="status">
        <h2>Đang tải đơn hàng…</h2>
        <p>MarketHub đang lấy danh sách đơn của bạn.</p>
      </div>
    );
  } else if (ketQuaDonHang.isError === true) {
    // Biến này cho biết lỗi có phải do phiên đăng nhập đã hết hạn hay không.
    const laLoiHetPhien = kiemTraLaLoiHetPhien(ketQuaDonHang.error);

    // Biến này lưu thông điệp lỗi hiển thị cho người dùng.
    const thongDiepLoi = layThongDiepLoiBackend(
      ketQuaDonHang.error,
      "Không tải được danh sách đơn hàng. Vui lòng thử lại.",
    );

    // Phần tử này hiển thị hành động phù hợp với loại lỗi.
    let phanTuHanhDong = (
      <button className="btn btn--primary" type="button" onClick={xuLyThuLaiDonHang}>
        <RefreshCw className="icon icon--sm" /> Thử lại
      </button>
    );

    // Nếu phiên đăng nhập hết hạn thì mời người dùng đăng nhập lại.
    if (laLoiHetPhien === true) {
      phanTuHanhDong = (
        <Link className="btn btn--primary" to="/login?redirect=/orders">
          Đăng nhập lại
        </Link>
      );
    }

    noiDungChinh = (
      <div className="catalog-state" role="alert">
        <CircleAlert className="icon icon--lg" />
        <h2>Không tải được đơn hàng</h2>
        <p>{thongDiepLoi}</p>
        {phanTuHanhDong}
      </div>
    );
  } else if (danhSachDonHang.length === 0) {
    noiDungChinh = (
      <div className="catalog-state">
        <h2>Chưa có đơn hàng</h2>
        <p>Bạn chưa có đơn hàng nào ở trạng thái này.</p>
        <Link className="btn btn--primary" to="/products">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  } else {
    // Phần tử này hiển thị thanh phân trang khi có nhiều hơn một trang.
    let phanTuPhanTrang = null;

    if (tongSoTrangDonHang > 1) {
      phanTuPhanTrang = (
        <nav className="pagination" aria-label="Phân trang đơn hàng">
          <button
            className="page-btn"
            type="button"
            onClick={xuLyVeTrangTruoc}
            disabled={soTrangTuBackend <= 1}
            aria-label="Trang trước"
          >
            <ChevronLeft className="icon icon--sm" />
          </button>

          {cacNutTrang}

          <button
            className="page-btn"
            type="button"
            onClick={xuLySangTrangSau}
            disabled={soTrangTuBackend >= tongSoTrangDonHang}
            aria-label="Trang sau"
          >
            <ChevronRight className="icon icon--sm" />
          </button>
        </nav>
      );
    }

    noiDungChinh = (
      <div>
        <div className="order-list">{cacTheDonHang}</div>

        {phanTuPhanTrang}
      </div>
    );
  }

  // Biến này lưu câu tóm tắt số đơn hàng đang hiển thị.
  let chuoiTomTatDonHang = tongSoDonHang + " đơn hàng";

  if (ketQuaDonHang.isFetching === true) {
    chuoiTomTatDonHang = chuoiTomTatDonHang + " · Đang cập nhật…";
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Đơn hàng của tôi</h1>
          <p>{chuoiTomTatDonHang}</p>
        </div>
        <div className="page-head__aside">
          <Link className="link" to="/account">
            Tài khoản của tôi
          </Link>
        </div>
      </div>

      <nav className="filter-tabs" aria-label="Lọc theo trạng thái">
        {cacTabLoc}
      </nav>

      {noiDungChinh}
    </div>
  );
}
