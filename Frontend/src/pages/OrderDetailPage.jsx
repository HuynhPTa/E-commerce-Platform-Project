import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  CircleAlert,
  CreditCard,
  ImageOff,
  MapPin,
  Pencil,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";
import {
  capNhatThongTinNhanHang,
  huyDonHang,
} from "../api/orderApi.js";
import HopThoai from "../components/common/Dialog.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useChiTietDonHang } from "../hooks/useOrders.js";
import { taoDuongDanTaiNguyen } from "../lib/assetUrl.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import { dinhDangTien } from "../lib/formatMoney.js";
import {
  dinhDangNgayGio,
  layLopTrangThaiDonHang,
  layLopTrangThaiThanhToan,
  layNhanPhuongThucThanhToan,
  layNhanTrangThaiDonHang,
  layNhanTrangThaiThanhToan,
  taoChuoiThuocTinh,
} from "../lib/orderFormat.js";
import {
  NHOM_TINH_THANH,
  laTinhThanhHoTro,
} from "../lib/shipping.js";

// Tiêu đề mặc định của tài liệu khi rời trang chi tiết đơn hàng.
const TIEU_DE_MAC_DINH = "Tất cả sản phẩm | MarketHub";

// Danh sách này khai báo năm bước tiến trình của một đơn hàng.
const CAC_BUOC_DON_HANG = [
  { ma: "PENDING", nhan: "Chờ xác nhận" },
  { ma: "CONFIRMED", nhan: "Đã xác nhận" },
  { ma: "SHIPPING", nhan: "Đang giao" },
  { ma: "DELIVERED", nhan: "Đã giao" },
  { ma: "COMPLETED", nhan: "Hoàn tất" },
];

// Hàm này trả về vị trí của trạng thái đơn hàng trong tiến trình năm bước.
// Đơn đã huỷ trả về -1 vì không còn nằm trong tiến trình giao hàng.
function layViTriBuocDonHang(trangThai) {
  if (trangThai === "PENDING") {
    return 0;
  }

  if (trangThai === "CONFIRMED") {
    return 1;
  }

  if (trangThai === "SHIPPING") {
    return 2;
  }

  if (trangThai === "DELIVERED") {
    return 3;
  }

  if (trangThai === "COMPLETED") {
    return 4;
  }

  return -1;
}

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

// Hàm này lấy mã trạng thái HTTP do backend trả về.
function layMaTrangThaiHttp(loi) {
  if (loi === undefined) {
    return undefined;
  }

  if (loi === null) {
    return undefined;
  }

  if (loi.response === undefined) {
    return undefined;
  }

  if (loi.response === null) {
    return undefined;
  }

  return loi.response.status;
}

// Hàm này kiểm tra thông tin nhận hàng trước khi gửi lên backend.
// Hàm trả về thông điệp lỗi đầu tiên hoặc chuỗi rỗng nếu dữ liệu hợp lệ.
function kiemTraThongTinNhanHang(
  nguoiNhanNhap,
  soDienThoaiNhap,
  diaChiNhap,
  tinhThanhNhap,
) {
  const nguoiNhanDaCat = nguoiNhanNhap.trim();
  const soDienThoaiDaCat = soDienThoaiNhap.trim();
  const diaChiDaCat = diaChiNhap.trim();

  if (nguoiNhanDaCat === "") {
    return "Vui lòng nhập tên người nhận.";
  }

  if (nguoiNhanDaCat.length > 120) {
    return "Tên người nhận tối đa 120 ký tự.";
  }

  if (soDienThoaiDaCat === "") {
    return "Vui lòng nhập số điện thoại.";
  }

  const mauSoDienThoai = /^[0-9]{9,11}$/;

  if (mauSoDienThoai.test(soDienThoaiDaCat) === false) {
    return "Số điện thoại phải gồm 9 đến 11 chữ số.";
  }

  if (diaChiDaCat === "") {
    return "Vui lòng nhập địa chỉ nhận hàng.";
  }

  if (diaChiDaCat.length > 500) {
    return "Địa chỉ tối đa 500 ký tự.";
  }

  if (laTinhThanhHoTro(tinhThanhNhap) === false) {
    return "Vui lòng chọn tỉnh/thành phố được hỗ trợ giao hàng.";
  }

  return "";
}

// Thành phần này hiển thị ảnh của một mặt hàng trong đơn.
function AnhMatHangDonHang(thuocTinh) {
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
        <ImageOff size={24} />
      </span>
    );
  }

  // Nếu ảnh đã từng bị lỗi thì hiển thị biểu tượng thay thế.
  if (coLoiAnh === true) {
    return (
      <span className="product-media__fallback">
        <ImageOff size={24} />
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

// Thành phần này hiển thị trang chi tiết một đơn hàng của cửa hàng.
export default function TrangChiTietDonHang() {
  // useAuth trả về trạng thái đăng nhập hiện tại.
  const trangThaiDangNhap = useAuth();

  // Biến này cho biết người dùng đã đăng nhập hay chưa.
  const daDangNhap = trangThaiDangNhap.daDangNhap;

  // useParams trả về các tham số trên đường dẫn hiện tại.
  const thamSoDuongDan = useParams();

  // Biến này lưu mã đơn hàng sau khi chuyển từ chuỗi sang số.
  let maDonHang = 0;
  const giaTriMaDonHang = thamSoDuongDan.orderId;

  if (giaTriMaDonHang !== undefined) {
    const soMaDonHang = Number(giaTriMaDonHang);

    if (Number.isInteger(soMaDonHang) === true) {
      if (soMaDonHang > 0) {
        maDonHang = soMaDonHang;
      }
    }
  }

  // Hook này gọi API lấy chi tiết đơn hàng khi mã đơn hợp lệ.
  const ketQuaChiTietDon = useChiTietDonHang(maDonHang, daDangNhap);

  // useQueryClient trả về bộ quản lý truy vấn để cập nhật dữ liệu đơn hàng.
  const boQuanLyTruyVan = useQueryClient();

  // Trạng thái này cho biết hộp thoại sửa thông tin nhận hàng đang mở hay không.
  const trangThaiFormSua = useState(false);
  const dangMoFormSua = trangThaiFormSua[0];
  const capNhatDangMoFormSua = trangThaiFormSua[1];

  // Trạng thái này lưu tên người nhận trong biểu mẫu sửa.
  const trangThaiTenNguoiNhanSua = useState("");
  const tenNguoiNhanSua = trangThaiTenNguoiNhanSua[0];
  const capNhatTenNguoiNhanSua = trangThaiTenNguoiNhanSua[1];

  // Trạng thái này lưu số điện thoại trong biểu mẫu sửa.
  const trangThaiSoDienThoaiSua = useState("");
  const soDienThoaiSua = trangThaiSoDienThoaiSua[0];
  const capNhatSoDienThoaiSua = trangThaiSoDienThoaiSua[1];

  // Trạng thái này lưu địa chỉ trong biểu mẫu sửa.
  const trangThaiDiaChiSua = useState("");
  const diaChiSua = trangThaiDiaChiSua[0];
  const capNhatDiaChiSua = trangThaiDiaChiSua[1];

  // Trạng thái này lưu tỉnh/thành phố trong biểu mẫu sửa.
  const trangThaiTinhThanhSua = useState("");
  const tinhThanhSua = trangThaiTinhThanhSua[0];
  const capNhatTinhThanhSua = trangThaiTinhThanhSua[1];

  // Trạng thái này lưu lỗi của biểu mẫu sửa thông tin nhận hàng.
  const trangThaiLoiSua = useState("");
  const loiSua = trangThaiLoiSua[0];
  const capNhatLoiSua = trangThaiLoiSua[1];

  // Trạng thái này cho biết biểu mẫu sửa đang gửi dữ liệu hay không.
  const trangThaiDangLuuSua = useState(false);
  const dangLuuSua = trangThaiDangLuuSua[0];
  const capNhatDangLuuSua = trangThaiDangLuuSua[1];

  // Trạng thái này cho biết hộp thoại xác nhận huỷ đơn đang mở hay không.
  const trangThaiXacNhanHuy = useState(false);
  const dangMoXacNhanHuy = trangThaiXacNhanHuy[0];
  const capNhatDangMoXacNhanHuy = trangThaiXacNhanHuy[1];

  // Trạng thái này cho biết yêu cầu huỷ đơn đang được gửi hay không.
  const trangThaiDangHuy = useState(false);
  const dangHuyDon = trangThaiDangHuy[0];
  const capNhatDangHuyDon = trangThaiDangHuy[1];

  // Trạng thái này lưu lỗi khi huỷ đơn.
  const trangThaiLoiHuy = useState("");
  const loiHuy = trangThaiLoiHuy[0];
  const capNhatLoiHuy = trangThaiLoiHuy[1];

  // Trạng thái này lưu thông báo thành công sau khi thao tác với đơn.
  const trangThaiThongBao = useState("");
  const thongBaoDonHang = trangThaiThongBao[0];
  const capNhatThongBaoDonHang = trangThaiThongBao[1];

  // Hàm này cập nhật tiêu đề tài liệu khi mở trang chi tiết đơn hàng.
  function xuLyCapNhatTieuDeTaiLieu() {
    if (maDonHang > 0) {
      document.title = "Đơn hàng #" + maDonHang + " | MarketHub";
    } else {
      document.title = "Đơn hàng | MarketHub";
    }

    // Hàm này khôi phục tiêu đề mặc định khi rời trang.
    function xuLyKhoiPhucTieuDe() {
      document.title = TIEU_DE_MAC_DINH;
    }

    return xuLyKhoiPhucTieuDe;
  }

  // useEffect cập nhật tiêu đề tài liệu sau khi trang được gắn vào giao diện.
  useEffect(xuLyCapNhatTieuDeTaiLieu, [maDonHang]);

  // Hàm này tạo lại yêu cầu tải chi tiết đơn khi người dùng bấm thử lại.
  function xuLyThuLaiChiTietDon() {
    ketQuaChiTietDon.refetch();
  }

  // Đường dẫn này đưa người dùng tới trang đăng nhập kèm tham số quay lại.
  const duongDanDangNhap =
    "/login?redirect=" + encodeURIComponent("/orders/" + maDonHang);

  // Phần tử này hiển thị nội dung chính theo trạng thái của trang.
  let noiDungChinh;

  // Nếu chưa đăng nhập thì yêu cầu đăng nhập trước khi xem chi tiết đơn.
  if (daDangNhap === false) {
    noiDungChinh = (
      <div className="catalog-state">
        <h2>Đăng nhập để xem đơn hàng</h2>
        <p>Chi tiết đơn hàng được gắn với tài khoản MarketHub của bạn.</p>
        <Link className="btn btn--primary" to={duongDanDangNhap}>
          Đăng nhập
        </Link>
      </div>
    );
  } else if (maDonHang <= 0) {
    noiDungChinh = (
      <div className="catalog-state" role="alert">
        <CircleAlert className="icon icon--lg" />
        <h2>Không xác định được đơn hàng</h2>
        <p>Đường dẫn chi tiết đơn hàng không hợp lệ hoặc đã bị cắt.</p>
        <Link className="btn btn--primary" to="/orders">
          Về danh sách đơn
        </Link>
      </div>
    );
  } else if (ketQuaChiTietDon.isLoading === true) {
    noiDungChinh = (
      <div className="catalog-state" role="status">
        <h2>Đang tải đơn hàng…</h2>
        <p>MarketHub đang lấy chi tiết đơn hàng của bạn.</p>
      </div>
    );
  } else if (ketQuaChiTietDon.isError === true) {
    // Biến này cho biết lỗi có phải do phiên đăng nhập đã hết hạn hay không.
    const laLoiHetPhien = kiemTraLaLoiHetPhien(ketQuaChiTietDon.error);

    // Biến này cho biết đơn hàng không tồn tại hoặc không thuộc tài khoản này.
    const laLoiKhongTimThay = layMaTrangThaiHttp(ketQuaChiTietDon.error) === 404;

    // Biến này lưu thông điệp lỗi mặc định hiển thị cho người dùng.
    let thongDiepMacDinh =
      "Không tải được chi tiết đơn hàng. Vui lòng thử lại.";

    if (laLoiKhongTimThay === true) {
      thongDiepMacDinh =
        "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc tài khoản của bạn.";
    }

    // Biến này lưu thông điệp lỗi hiển thị cho người dùng.
    const thongDiepLoi = layThongDiepLoiBackend(
      ketQuaChiTietDon.error,
      thongDiepMacDinh,
    );

    // Phần tử này hiển thị hành động phù hợp với loại lỗi.
    let phanTuHanhDong = (
      <button
        className="btn btn--primary"
        type="button"
        onClick={xuLyThuLaiChiTietDon}
      >
        <RefreshCw className="icon icon--sm" /> Thử lại
      </button>
    );

    // Nếu phiên đăng nhập hết hạn thì mời người dùng đăng nhập lại.
    if (laLoiHetPhien === true) {
      phanTuHanhDong = (
        <Link className="btn btn--primary" to={duongDanDangNhap}>
          Đăng nhập lại
        </Link>
      );
    }

    noiDungChinh = (
      <div className="catalog-state" role="alert">
        <CircleAlert className="icon icon--lg" />
        <h2>Không tải được đơn hàng</h2>
        <p>{thongDiepLoi}</p>
        <div className="btn-row">
          {phanTuHanhDong}
          <Link className="btn" to="/orders">
            Về danh sách đơn
          </Link>
        </div>
      </div>
    );
  } else {
    // Biến này lưu dữ liệu chi tiết đơn sau khi kiểm tra null.
    let duLieuDonHang = null;
    const duLieuTruyVan = ketQuaChiTietDon.data;

    if (duLieuTruyVan !== undefined) {
      if (duLieuTruyVan !== null) {
        duLieuDonHang = duLieuTruyVan;
      }
    }

    // Nếu backend không trả về dữ liệu thì hiển thị trạng thái lỗi.
    if (duLieuDonHang === null) {
      noiDungChinh = (
        <div className="catalog-state" role="alert">
          <CircleAlert className="icon icon--lg" />
          <h2>Không tải được đơn hàng</h2>
          <p>Backend không trả về dữ liệu cho đơn hàng này.</p>
          <Link className="btn btn--primary" to="/orders">
            Về danh sách đơn
          </Link>
        </div>
      );
    } else {
      // Biến này lưu trạng thái hiện tại của đơn hàng.
      let trangThaiDonHang = "PENDING";

      if (typeof duLieuDonHang.status === "string") {
        trangThaiDonHang = duLieuDonHang.status;
      }

      // Biến này lưu vị trí của đơn hàng trong tiến trình giao hàng.
      const viTriBuocHienTai = layViTriBuocDonHang(trangThaiDonHang);

      // Biến này cho biết đơn hàng đã bị huỷ hay chưa.
      let donHangDaHuy = false;

      if (trangThaiDonHang === "CANCELLED") {
        donHangDaHuy = true;
      }

      // Mảng này lưu các bước của tiến trình đơn hàng.
      const cacBuocTienTrinh = [];

      // Tạo từng bước tiến trình từ danh sách bước đã khai báo.
      for (let chiSoBuoc = 0; chiSoBuoc < CAC_BUOC_DON_HANG.length; chiSoBuoc++) {
        const buocDonHang = CAC_BUOC_DON_HANG[chiSoBuoc];

        // Biến này lưu lớp CSS của bước đang xét.
        let lopBuoc = "timeline__step";

        // Đơn đã huỷ chỉ đánh dấu bước đầu tiên là đã xử lý.
        if (donHangDaHuy === true) {
          if (chiSoBuoc === 0) {
            lopBuoc = "timeline__step timeline__step--done";
          }
        } else {
          if (chiSoBuoc < viTriBuocHienTai) {
            lopBuoc = "timeline__step timeline__step--done";
          }

          if (chiSoBuoc === viTriBuocHienTai) {
            lopBuoc = "timeline__step timeline__step--current";
          }
        }

        // Biến này lưu chú thích thời gian của bước đang xét.
        let chuThichThoiGian = "Chưa tới";

        if (chiSoBuoc === 0) {
          chuThichThoiGian = dinhDangNgayGio(duLieuDonHang.createdAt);
        } else if (chiSoBuoc < viTriBuocHienTai) {
          chuThichThoiGian = "Đã xử lý";
        } else if (chiSoBuoc === viTriBuocHienTai) {
          chuThichThoiGian = dinhDangNgayGio(duLieuDonHang.updatedAt);
        }

        cacBuocTienTrinh.push(
          <div className={lopBuoc} key={buocDonHang.ma}>
            <div className="timeline__bar"></div>
            <div className="timeline__label">{buocDonHang.nhan}</div>
            <div className="timeline__date">{chuThichThoiGian}</div>
          </div>,
        );
      }

      // Biến này lưu danh sách mặt hàng sau khi kiểm tra dữ liệu trả về.
      let danhSachMatHang = [];

      if (Array.isArray(duLieuDonHang.items) === true) {
        danhSachMatHang = duLieuDonHang.items;
      }

      // Mảng này lưu các dòng mặt hàng trong đơn.
      const cacDongMatHang = [];

      // Tạo từng dòng mặt hàng từ dữ liệu thật của backend.
      for (const matHang of danhSachMatHang) {
        // Biến này lưu chuỗi thuộc tính của phiên bản đã mua.
        const chuoiThuocTinh = taoChuoiThuocTinh(matHang.attributes);

        // Biến này lưu phần mô tả phụ của mặt hàng.
        let moTaMatHang =
          "SL " +
          matHang.quantity +
          ", " +
          dinhDangTien(matHang.unitPriceMinor) +
          " / sản phẩm";

        if (chuoiThuocTinh !== "") {
          moTaMatHang =
            chuoiThuocTinh +
            ", SL " +
            matHang.quantity +
            ", " +
            dinhDangTien(matHang.unitPriceMinor) +
            " / sản phẩm";
        }

        cacDongMatHang.push(
          <div className="order-item" key={matHang.id}>
            <span className="order-item__media">
              <AnhMatHangDonHang matHang={matHang} />
            </span>
            <span>
              <span className="order-item__name">{matHang.productName}</span>
              <span className="order-item__meta">{moTaMatHang}</span>
            </span>
            <span className="order-item__price">
              {dinhDangTien(matHang.subtotalMinor)}
            </span>
          </div>,
        );
      }

      // Phần tử này hiển thị thông báo khi đơn hàng không có mặt hàng nào.
      let phanTuDanhSachMatHang = (
        <p className="muted">Đơn hàng chưa có mặt hàng nào.</p>
      );

      if (cacDongMatHang.length > 0) {
        phanTuDanhSachMatHang = <div>{cacDongMatHang}</div>;
      }

      // Biến này lưu thông tin địa chỉ nhận hàng từ ảnh chụp lúc đặt.
      let diaChiNhanHang = null;

      if (duLieuDonHang.shippingAddress !== undefined) {
        if (duLieuDonHang.shippingAddress !== null) {
          if (typeof duLieuDonHang.shippingAddress === "object") {
            diaChiNhanHang = duLieuDonHang.shippingAddress;
          }
        }
      }

      // Biến này lưu tên người nhận hiển thị trên trang.
      let tenNguoiNhan = "";

      if (diaChiNhanHang !== null) {
        if (typeof diaChiNhanHang.recipientName === "string") {
          tenNguoiNhan = diaChiNhanHang.recipientName;
        }
      }

      // Biến này lưu số điện thoại người nhận hiển thị trên trang.
      let soDienThoaiNguoiNhan = "";

      if (diaChiNhanHang !== null) {
        if (typeof diaChiNhanHang.phone === "string") {
          soDienThoaiNguoiNhan = diaChiNhanHang.phone;
        }
      }

      // Biến này lưu địa chỉ đầy đủ của người nhận.
      let diaChiDayDuNguoiNhan = "";

      if (diaChiNhanHang !== null) {
        if (typeof diaChiNhanHang.fullAddress === "string") {
          diaChiDayDuNguoiNhan = diaChiNhanHang.fullAddress;
        }
      }

      // Biến này lưu tỉnh/thành phố của người nhận.
      let tinhThanhNguoiNhan = "";

      if (diaChiNhanHang !== null) {
        if (typeof diaChiNhanHang.province === "string") {
          tinhThanhNguoiNhan = diaChiNhanHang.province;
        }
      }

      // Biến này cho biết khách còn được sửa hoặc huỷ đơn hay không.
      let coTheSuaNhanHang = false;

      if (trangThaiDonHang === "PENDING") {
        coTheSuaNhanHang = true;
      }

      let coTheHuyDon = false;

      if (trangThaiDonHang === "PENDING") {
        coTheHuyDon = true;
      }

      if (trangThaiDonHang === "CONFIRMED") {
        coTheHuyDon = true;
      }

      if (duLieuDonHang.paymentStatus === "SUCCEEDED") {
        coTheHuyDon = false;
      }

      // Mảng này lưu các nhóm tỉnh/thành trong biểu mẫu sửa địa chỉ.
      const cacNhomTinhThanhSua = [];

      for (const nhomTinhThanh of NHOM_TINH_THANH) {
        const cacLuaChonTinh = [];

        for (const tenTinh of nhomTinhThanh.tinhThanh) {
          cacLuaChonTinh.push(
            <option key={tenTinh} value={tenTinh}>
              {tenTinh}
            </option>,
          );
        }

        cacNhomTinhThanhSua.push(
          <optgroup key={nhomTinhThanh.nhan} label={nhomTinhThanh.nhan}>
            {cacLuaChonTinh}
          </optgroup>,
        );
      }

      // Hàm này mở biểu mẫu sửa thông tin nhận hàng với dữ liệu hiện tại.
      function xuLyMoFormSuaNhanHang() {
        capNhatTenNguoiNhanSua(tenNguoiNhan);
        capNhatSoDienThoaiSua(soDienThoaiNguoiNhan);
        capNhatDiaChiSua(diaChiDayDuNguoiNhan);
        capNhatTinhThanhSua(tinhThanhNguoiNhan);
        capNhatLoiSua("");
        capNhatDangMoFormSua(true);
      }

      // Hàm này đóng biểu mẫu sửa thông tin nhận hàng.
      function xuLyDongFormSuaNhanHang() {
        capNhatDangMoFormSua(false);
        capNhatLoiSua("");
      }

      // Hàm này gửi thông tin nhận hàng mới lên backend.
      async function xuLyGuiSuaNhanHang(suKienGui) {
        suKienGui.preventDefault();

        const thongDiepLoi = kiemTraThongTinNhanHang(
          tenNguoiNhanSua,
          soDienThoaiSua,
          diaChiSua,
          tinhThanhSua,
        );

        if (thongDiepLoi !== "") {
          capNhatLoiSua(thongDiepLoi);
          return;
        }

        capNhatLoiSua("");
        capNhatDangLuuSua(true);

        const duLieuMoi = {
          recipientName: tenNguoiNhanSua.trim(),
          phone: soDienThoaiSua.trim(),
          fullAddress: diaChiSua.trim(),
          province: tinhThanhSua,
        };

        try {
          const donHangSauCapNhat = await capNhatThongTinNhanHang(
            maDonHang,
            duLieuMoi,
          );
          boQuanLyTruyVan.setQueryData(
            ["order-detail", maDonHang],
            donHangSauCapNhat,
          );
          boQuanLyTruyVan.invalidateQueries({ queryKey: ["orders"] });
          capNhatThongBaoDonHang("Đã cập nhật thông tin nhận hàng.");
          capNhatDangMoFormSua(false);
          capNhatDangLuuSua(false);
        } catch (loi) {
          const thongDiep = layThongDiepLoiBackend(
            loi,
            "Không cập nhật được thông tin nhận hàng. Vui lòng thử lại.",
          );
          capNhatLoiSua(thongDiep);
          capNhatDangLuuSua(false);
        }
      }

      // Hàm này mở hộp thoại xác nhận huỷ đơn.
      function xuLyMoXacNhanHuyDon() {
        capNhatLoiHuy("");
        capNhatDangMoXacNhanHuy(true);
      }

      // Hàm này đóng hộp thoại xác nhận huỷ đơn.
      function xuLyDongXacNhanHuyDon() {
        capNhatDangMoXacNhanHuy(false);
        capNhatLoiHuy("");
      }

      // Hàm này gửi yêu cầu huỷ đơn lên backend.
      async function xuLyXacNhanHuyDon() {
        capNhatLoiHuy("");
        capNhatDangHuyDon(true);

        try {
          const donHangSauKhiHuy = await huyDonHang(maDonHang);
          boQuanLyTruyVan.setQueryData(
            ["order-detail", maDonHang],
            donHangSauKhiHuy,
          );
          boQuanLyTruyVan.invalidateQueries({ queryKey: ["orders"] });
          boQuanLyTruyVan.invalidateQueries({ queryKey: ["cart"] });
          capNhatThongBaoDonHang("Đã huỷ đơn hàng.");
          capNhatDangMoXacNhanHuy(false);
          capNhatDangHuyDon(false);
        } catch (loi) {
          const thongDiep = layThongDiepLoiBackend(
            loi,
            "Không huỷ được đơn hàng. Vui lòng thử lại.",
          );
          capNhatLoiHuy(thongDiep);
          capNhatDangHuyDon(false);
        }
      }

      // Biến này lưu nhãn của cổng thanh toán đã chọn.
      const nhanPhuongThuc = layNhanPhuongThucThanhToan(
        duLieuDonHang.paymentMethod,
      );

      // Biến này lưu nhãn của trạng thái thanh toán.
      let nhanTrangThaiThanhToan = layNhanTrangThaiThanhToan(
        duLieuDonHang.paymentStatus,
      );

      // COD chưa thu tiền nên hiển thị đúng hình thức thanh toán.
      if (duLieuDonHang.paymentMethod === "COD") {
        if (duLieuDonHang.paymentStatus === "PENDING") {
          nhanTrangThaiThanhToan = "Thanh toán khi nhận hàng";
        }
      }

      // Biến này lưu lớp CSS của trạng thái thanh toán.
      const lopTrangThaiThanhToan = layLopTrangThaiThanhToan(
        duLieuDonHang.paymentStatus,
      );

      // Biến này cho biết người dùng có thể mở lại trang thanh toán hay không.
      let coTheThanhToanLai = false;

      if (trangThaiDonHang === "PENDING") {
        coTheThanhToanLai = true;
      }

      if (duLieuDonHang.paymentStatus === "SUCCEEDED") {
        coTheThanhToanLai = false;
      }

      // COD không có giao dịch trực tuyến để thanh toán lại.
      if (duLieuDonHang.paymentMethod === "COD") {
        coTheThanhToanLai = false;
      }

      // Đường dẫn này mở lại trang kết quả để tạo giao dịch thanh toán mới.
      const duongDanThanhToanLai =
        "/checkout/result?checkoutId=" + duLieuDonHang.checkoutSessionId;

      // Phần tử này hiển thị nút thanh toán lại khi đơn còn chờ xử lý.
      let phanTuThanhToanLai = null;

      if (coTheThanhToanLai === true) {
        phanTuThanhToanLai = (
          <Link className="btn btn--primary btn--block" to={duongDanThanhToanLai}>
            <CreditCard className="icon icon--sm" /> Thanh toán lại
          </Link>
        );
      }

      // Phần tử này hiển thị cảnh báo khi đơn hàng đã bị huỷ.
      let phanTuCanhBaoHuyDon = null;

      if (donHangDaHuy === true) {
        phanTuCanhBaoHuyDon = (
          <div className="alert alert--danger" role="status">
            <CircleAlert className="icon icon--sm" />
            <div>
              Đơn hàng đã bị huỷ. Nếu cần hỗ trợ, vui lòng liên hệ MarketHub
              trong khung 8:00 tới 21:00.
            </div>
          </div>
        );
      }

      // Phần tử này hiển thị thông báo thành công sau khi thao tác với đơn.
      let phanTuThongBaoDonHang = null;

      if (thongBaoDonHang !== "") {
        phanTuThongBaoDonHang = (
          <div className="alert alert--success" role="status">
            <CircleAlert className="icon icon--sm" />
            <div>{thongBaoDonHang}</div>
          </div>
        );
      }

      // Phần tử này hiển thị nút huỷ đơn khi đơn còn được phép huỷ.
      let phanTuNutHuyDon = null;

      if (coTheHuyDon === true) {
        phanTuNutHuyDon = (
          <button
            className="btn btn--danger btn--block"
            type="button"
            onClick={xuLyMoXacNhanHuyDon}
          >
            <XCircle className="icon icon--sm" /> Huỷ đơn hàng
          </button>
        );
      }

      // Phần tử này hiển thị lỗi của biểu mẫu sửa thông tin nhận hàng.
      let phanTuLoiSua = null;

      if (loiSua !== "") {
        phanTuLoiSua = (
          <div className="alert alert--danger" role="alert">
            <CircleAlert className="icon icon--sm" />
            <div>{loiSua}</div>
          </div>
        );
      }

      // Phần tử này hiển thị lỗi khi huỷ đơn thất bại.
      let phanTuLoiHuy = null;

      if (loiHuy !== "") {
        phanTuLoiHuy = (
          <div className="alert alert--danger" role="alert">
            <CircleAlert className="icon icon--sm" />
            <div>{loiHuy}</div>
          </div>
        );
      }

      // Phần tử này hiển thị các thao tác khách còn được phép thực hiện.
      let phanTuThaoTacDonHang = null;

      if (coTheSuaNhanHang === true) {
        phanTuThaoTacDonHang = (
          <div className="side-card">
            <h2>Thao tác đơn hàng</h2>
            <button
              className="btn btn--block"
              type="button"
              onClick={xuLyMoFormSuaNhanHang}
            >
              <Pencil className="icon icon--sm" /> Sửa thông tin nhận hàng
            </button>
            {phanTuNutHuyDon}
          </div>
        );
      } else if (coTheHuyDon === true) {
        phanTuThaoTacDonHang = (
          <div className="side-card">
            <h2>Thao tác đơn hàng</h2>
            {phanTuNutHuyDon}
          </div>
        );
      }

      // Phần tử này hiển thị hộp thoại sửa thông tin nhận hàng.
      let phanTuHopThoaiSua = null;

      if (dangMoFormSua === true) {
        phanTuHopThoaiSua = (
          <HopThoai
            title="Sửa thông tin nhận hàng"
            onClose={xuLyDongFormSuaNhanHang}
            width={560}
            footer={
              <>
                <button
                  className="btn"
                  type="button"
                  onClick={xuLyDongFormSuaNhanHang}
                  disabled={dangLuuSua === true}
                >
                  Giữ nguyên
                </button>
                <button
                  className="btn btn--primary"
                  type="submit"
                  form="bieu-mau-sua-nhan-hang"
                  disabled={dangLuuSua === true}
                >
                  Lưu thay đổi
                </button>
              </>
            }
          >
            <form
              className="admin-form"
              id="bieu-mau-sua-nhan-hang"
              onSubmit={xuLyGuiSuaNhanHang}
            >
              {phanTuLoiSua}
              <div className="form-grid">
                <div className="field span-2">
                  <label className="required" htmlFor="sua-nguoi-nhan">
                    Người nhận
                  </label>
                  <input
                    className="input"
                    id="sua-nguoi-nhan"
                    value={tenNguoiNhanSua}
                    onChange={function (suKienNhap) {
                      capNhatTenNguoiNhanSua(suKienNhap.currentTarget.value);
                    }}
                    maxLength="120"
                    autoComplete="name"
                  />
                </div>
                <div className="field span-2">
                  <label className="required" htmlFor="sua-dien-thoai">
                    Số điện thoại
                  </label>
                  <input
                    className="input"
                    id="sua-dien-thoai"
                    value={soDienThoaiSua}
                    onChange={function (suKienNhap) {
                      capNhatSoDienThoaiSua(suKienNhap.currentTarget.value);
                    }}
                    inputMode="numeric"
                    maxLength="11"
                    autoComplete="tel"
                  />
                </div>
                <div className="field span-2">
                  <label className="required" htmlFor="sua-dia-chi">
                    Địa chỉ
                  </label>
                  <textarea
                    className="textarea"
                    id="sua-dia-chi"
                    value={diaChiSua}
                    onChange={function (suKienNhap) {
                      capNhatDiaChiSua(suKienNhap.currentTarget.value);
                    }}
                    rows="3"
                    maxLength="500"
                    autoComplete="street-address"
                  />
                </div>
                <div className="field span-2">
                  <label className="required" htmlFor="sua-tinh-thanh">
                    Tỉnh/thành phố
                  </label>
                  <select
                    className="select"
                    id="sua-tinh-thanh"
                    value={tinhThanhSua}
                    onChange={function (suKienChon) {
                      capNhatTinhThanhSua(suKienChon.currentTarget.value);
                    }}
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {cacNhomTinhThanhSua}
                  </select>
                  <span className="field-hint">
                    Đổi tỉnh/thành có thể làm thay đổi phí giao hàng của đơn.
                  </span>
                </div>
              </div>
            </form>
          </HopThoai>
        );
      }

      // Phần tử này hiển thị hộp thoại xác nhận huỷ đơn.
      let phanTuHopThoaiHuy = null;

      if (dangMoXacNhanHuy === true) {
        phanTuHopThoaiHuy = (
          <HopThoai
            title="Huỷ đơn hàng"
            onClose={xuLyDongXacNhanHuyDon}
            width={480}
            footer={
              <>
                <button
                  className="btn"
                  type="button"
                  onClick={xuLyDongXacNhanHuyDon}
                  disabled={dangHuyDon === true}
                >
                  Giữ đơn
                </button>
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={xuLyXacNhanHuyDon}
                  disabled={dangHuyDon === true}
                >
                  {dangHuyDon === true ? "Đang huỷ…" : "Huỷ đơn hàng"}
                </button>
              </>
            }
          >
            <p>
              Bạn có chắc muốn huỷ đơn <strong>#{duLieuDonHang.id}</strong>?
              Tồn kho sẽ được hoàn lại và thao tác này không thể hoàn tác.
            </p>
            {phanTuLoiHuy}
          </HopThoai>
        );
      }

      noiDungChinh = (
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/products">Trang chủ</Link>
            <span>/</span>
            <Link to="/orders">Đơn hàng</Link>
            <span>/</span>
            <span aria-current="page">#{duLieuDonHang.id}</span>
          </nav>

          <div className="page-head">
            <div>
              <h1>Đơn hàng #{duLieuDonHang.id}</h1>
              <p>
                Đặt {dinhDangNgayGio(duLieuDonHang.createdAt)}, cập nhật{" "}
                {dinhDangNgayGio(duLieuDonHang.updatedAt)}, {nhanPhuongThuc}
              </p>
            </div>
            <div className="page-head__aside">
              <span className={layLopTrangThaiDonHang(trangThaiDonHang)}>
                {layNhanTrangThaiDonHang(trangThaiDonHang)}
              </span>
            </div>
          </div>

          <div className="timeline" aria-label="Tiến trình đơn hàng">
            {cacBuocTienTrinh}
          </div>

          {phanTuCanhBaoHuyDon}
          {phanTuThongBaoDonHang}

          <div className="order-detail">
            <div>
              <section className="order-block">
                <h2>Sản phẩm</h2>
                {phanTuDanhSachMatHang}
              </section>

              <section className="order-block">
                <h2>Tổng cộng</h2>
                <div className="summary__rows">
                  <div className="summary__row">
                    <span>Tạm tính</span>
                    <span>{dinhDangTien(duLieuDonHang.subtotalMinor)}</span>
                  </div>
                  <div className="summary__row">
                    <span>Phí giao hàng</span>
                    <span>{dinhDangTienPhiGiaoHang(duLieuDonHang.shippingFeeMinor)}</span>
                  </div>
                  <div className="summary__row summary__row--total">
                    <span>Tổng cộng</span>
                    <span>{dinhDangTien(duLieuDonHang.totalMinor)}</span>
                  </div>
                </div>
              </section>

              <section className="order-block">
                <h2>Hỗ trợ</h2>
                <p className="muted order-note">
                  Cần thay đổi địa chỉ hoặc kiểm tra đơn? Liên hệ hỗ trợ 8:00 tới
                  21:00.
                </p>
              </section>
            </div>

            <aside className="order-side">
              <div className="side-card">
                <h2>Địa chỉ nhận hàng</h2>
                <dl className="info-list">
                  <div className="info-list__row">
                    <dt>
                      <User className="icon icon--sm" /> Người nhận
                    </dt>
                    <dd>{tenNguoiNhan}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>Điện thoại</dt>
                    <dd>{soDienThoaiNguoiNhan}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>
                      <MapPin className="icon icon--sm" /> Địa chỉ
                    </dt>
                    <dd>{diaChiDayDuNguoiNhan}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>Tỉnh/thành phố</dt>
                    <dd>{tinhThanhNguoiNhan}</dd>
                  </div>
                </dl>
              </div>

              <div className="side-card">
                <h2>Thanh toán</h2>
                <dl className="info-list">
                  <div className="info-list__row">
                    <dt>Phương thức</dt>
                    <dd>{nhanPhuongThuc}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>Trạng thái</dt>
                    <dd>
                      <span className={lopTrangThaiThanhToan}>
                        {nhanTrangThaiThanhToan}
                      </span>
                    </dd>
                  </div>
                  <div className="info-list__row">
                    <dt>Số tiền</dt>
                    <dd>{dinhDangTien(duLieuDonHang.totalMinor)}</dd>
                  </div>
                </dl>
                {phanTuThanhToanLai}
              </div>

              {phanTuThaoTacDonHang}

              <Link className="btn btn--block" to="/orders">
                Về danh sách đơn
              </Link>
            </aside>
          </div>

          {phanTuHopThoaiSua}
          {phanTuHopThoaiHuy}
        </div>
      );
    }
  }

  return <div className="container">{noiDungChinh}</div>;
}

// Hàm này định dạng phí giao hàng, hiển thị "Miễn phí" khi phí bằng không.
function dinhDangTienPhiGiaoHang(phiGiaoHang) {
  // Biến này lưu giá trị số của phí giao hàng.
  const soPhiGiaoHang = Number(phiGiaoHang);

  if (soPhiGiaoHang === 0) {
    return "Miễn phí";
  }

  return dinhDangTien(phiGiaoHang);
}
