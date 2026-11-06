import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, ImageOff, ShieldCheck } from "lucide-react";
import {
  datHang,
  taoDuongDanThanhToan,
} from "../api/checkoutApi.js";
import { useAuth } from "../hooks/useAuth.js";
import { useGioHang } from "../hooks/useCart.js";
import { useDanhSachDiaChi } from "../hooks/useCheckout.js";
import { taoDuongDanTaiNguyen } from "../lib/assetUrl.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import { dinhDangTien } from "../lib/formatMoney.js";
import {
  NHOM_TINH_THANH,
  laTinhThanhHoTro,
  tinhPhiGiaoHang,
} from "../lib/shipping.js";

// Tiêu đề mặc định của tài liệu khi rời trang thanh toán.
const TIEU_DE_MAC_DINH = "Tất cả sản phẩm | MarketHub";

// Bảng này đổi tên thuộc tính kỹ thuật sang nhãn tiếng Việt dễ đọc.
const BANG_NHAN_THUOC_TINH = {
  color: "Màu",
  size: "Kích thước",
  layout: "Bố cục",
  switch: "Loại switch",
  set: "Bộ",
  "loại": "Loại",
};

// Các mã lỗi cho biết giỏ hàng cần được tải lại sau khi đặt hàng thất bại.
const MA_LOI_CAN_TAI_LAI_GIO_HANG = [1033, 1061, 1062, 1063, 1150];

// Hàm này tạo khoá duy nhất cho một lượt đặt hàng.
// Khoá được giữ nguyên khi người dùng thử lại để backend không tạo trùng đơn.
function taoKhoaChongTrung() {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  }

  const soThoiGian = Date.now();
  const soNgauNhien = Math.random();
  const chuoiNgauNhien = soNgauNhien.toString(36);
  const phanNgauNhien = chuoiNgauNhien.substring(2);

  return "checkout-" + soThoiGian + "-" + phanNgauNhien;
}

// Hàm này trả về nhãn tiếng Việt của một thuộc tính phiên bản.
// Nếu chưa có nhãn phù hợp thì giữ nguyên tên thuộc tính.
function taoNhanThuocTinh(khoaThuocTinh) {
  const nhanDaBiet = BANG_NHAN_THUOC_TINH[khoaThuocTinh];

  if (nhanDaBiet !== undefined) {
    return nhanDaBiet;
  }

  return khoaThuocTinh;
}

// Hàm này ghép các thuộc tính của phiên bản thành một chuỗi dễ đọc.
function taoChuoiThuocTinh(thuocTinhPhienBan) {
  if (thuocTinhPhienBan === undefined) {
    return "";
  }

  if (thuocTinhPhienBan === null) {
    return "";
  }

  const cacCapThuocTinh = Object.entries(thuocTinhPhienBan);
  const cacPhan = [];

  for (const capThuocTinh of cacCapThuocTinh) {
    const khoaThuocTinh = capThuocTinh[0];
    const giaTriThuocTinh = capThuocTinh[1];
    const nhanThuocTinh = taoNhanThuocTinh(khoaThuocTinh);
    cacPhan.push(nhanThuocTinh + ": " + giaTriThuocTinh);
  }

  return cacPhan.join(" · ");
}

// Hàm này tính thành tiền của một dòng hàng trong giỏ.
function tinhTienMotDong(matHang) {
  const donGia = Number(matHang.unitPriceMinor);
  const soLuong = Number(matHang.quantity);

  if (Number.isFinite(donGia) === false) {
    return 0;
  }

  if (Number.isFinite(soLuong) === false) {
    return 0;
  }

  return donGia * soLuong;
}

// Hàm này tính tổng số sản phẩm trong giỏ, gồm cả số lượng của từng dòng.
function tinhTongSoLuong(danhSachMatHang) {
  let tongSoLuong = 0;

  for (const matHang of danhSachMatHang) {
    const soLuong = Number(matHang.quantity);

    if (Number.isFinite(soLuong) === true) {
      tongSoLuong += soLuong;
    }
  }

  return tongSoLuong;
}

// Hàm này tính tạm tính của toàn bộ giỏ hàng.
function tinhTamTinh(danhSachMatHang) {
  let tamTinh = 0;

  for (const matHang of danhSachMatHang) {
    tamTinh += tinhTienMotDong(matHang);
  }

  return tamTinh;
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

// Hàm này lấy mã lỗi nghiệp vụ do backend trả về.
function layMaLoiBackend(loi) {
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

  const duLieuLoi = loi.response.data;

  if (duLieuLoi === undefined) {
    return undefined;
  }

  if (duLieuLoi === null) {
    return undefined;
  }

  return duLieuLoi.code;
}

// Hàm này cho biết lỗi đặt hàng có liên quan tới dữ liệu giỏ hàng hay không.
function kiemTraLaLoiGioHang(loi) {
  const maLoi = layMaLoiBackend(loi);

  for (const maLoiCanKiemTra of MA_LOI_CAN_TAI_LAI_GIO_HANG) {
    if (maLoi === maLoiCanKiemTra) {
      return true;
    }
  }

  return false;
}

// Hàm này kiểm tra thông tin nhận hàng trước khi gửi lên backend.
// Hàm trả về một đối tượng chứa thông điệp lỗi của từng trường.
function kiemTraThongTinDatHang(
  nguoiNhanNhap,
  soDienThoaiNhap,
  diaChiNhap,
  tinhThanhNhap,
) {
  const loiBieuMau = {};
  const nguoiNhanDaCat = nguoiNhanNhap.trim();
  const soDienThoaiDaCat = soDienThoaiNhap.trim();
  const diaChiDaCat = diaChiNhap.trim();
  const tinhThanhDaCat = tinhThanhNhap.trim();

  if (nguoiNhanDaCat === "") {
    loiBieuMau.recipientName = "Vui lòng nhập tên người nhận.";
  } else {
    if (nguoiNhanDaCat.length > 120) {
      loiBieuMau.recipientName = "Tên người nhận tối đa 120 ký tự.";
    }
  }

  if (soDienThoaiDaCat === "") {
    loiBieuMau.phone = "Vui lòng nhập số điện thoại.";
  } else {
    const mauSoDienThoai = /^[0-9]{9,11}$/;

    if (mauSoDienThoai.test(soDienThoaiDaCat) === false) {
      loiBieuMau.phone = "Số điện thoại phải gồm 9 đến 11 chữ số.";
    }
  }

  if (diaChiDaCat === "") {
    loiBieuMau.fullAddress = "Vui lòng nhập địa chỉ nhận hàng.";
  } else {
    if (diaChiDaCat.length > 500) {
      loiBieuMau.fullAddress = "Địa chỉ tối đa 500 ký tự.";
    }
  }

  if (tinhThanhDaCat === "") {
    loiBieuMau.province = "Vui lòng chọn tỉnh/thành phố.";
  } else {
    if (laTinhThanhHoTro(tinhThanhDaCat) === false) {
      loiBieuMau.province = "Tỉnh/thành phố chưa được hỗ trợ giao hàng.";
    }
  }

  return loiBieuMau;
}

// Thành phần này hiển thị thông điệp lỗi dưới một trường của biểu mẫu.
function LoiTruong(thuocTinh) {
  if (thuocTinh.noiDung === undefined) {
    return null;
  }

  if (thuocTinh.noiDung === "") {
    return null;
  }

  return (
    <p className="field-error" role="alert">
      {thuocTinh.noiDung}
    </p>
  );
}

// Thành phần này hiển thị ảnh nhỏ của một mặt hàng trong phần tóm tắt.
function AnhDonHangNho(thuocTinh) {
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

  // Phần tử này hiển thị ảnh sản phẩm hoặc biểu tượng thay thế.
  let phanTuAnhSanPham = null;

  // Chỉ hiển thị ảnh khi có đường dẫn và ảnh chưa bị lỗi.
  if (duongDanAnhSanPham !== null) {
    if (coLoiAnh === false) {
      phanTuAnhSanPham = (
        <img
          src={duongDanAnhSanPham}
          alt={matHang.productName}
          loading="lazy"
          onError={xuLyLoiAnh}
        />
      );
    }
  }

  // Nếu không có ảnh dùng được thì hiển thị biểu tượng thay thế.
  if (phanTuAnhSanPham === null) {
    phanTuAnhSanPham = (
      <span className="product-media__fallback">
        <ImageOff size={18} />
      </span>
    );
  }

  return (
    <span className="order-mini__media">{phanTuAnhSanPham}</span>
  );
}

// Thành phần này hiển thị trang thanh toán của cửa hàng.
export default function TrangThanhToan() {
  // useAuth trả về trạng thái đăng nhập hiện tại.
  const trangThaiDangNhap = useAuth();

  // Biến này cho biết người dùng đã đăng nhập hay chưa.
  const daDangNhap = trangThaiDangNhap.daDangNhap;

  // Biến này lưu mã người dùng hiện tại để phát hiện lúc đổi tài khoản.
  let maNguoiDung = null;

  if (trangThaiDangNhap.nguoiDung !== undefined) {
    if (trangThaiDangNhap.nguoiDung !== null) {
      if (Number.isInteger(trangThaiDangNhap.nguoiDung.id) === true) {
        maNguoiDung = trangThaiDangNhap.nguoiDung.id;
      }
    }
  }

  // Hook này gọi API lấy giỏ hàng khi người dùng đã đăng nhập.
  const ketQuaGioHang = useGioHang(daDangNhap);

  // Hook này gọi API lấy danh sách địa chỉ đã lưu của người dùng.
  const ketQuaDiaChi = useDanhSachDiaChi(daDangNhap);

  // Hook này đọc các tham số trên đường dẫn, gồm danh sách món cần thanh toán.
  const thamSoDuongDan = useSearchParams();
  const cacThamSo = thamSoDuongDan[0];
  const chuoiMaMatHang = cacThamSo.get("cartItemIds");

  // Mảng này lưu mã các mặt hàng khách đã chọn ở giỏ hàng.
  const mangMaMatHang = [];

  if (typeof chuoiMaMatHang === "string") {
    if (chuoiMaMatHang.trim() !== "") {
      const cacMaDangChuoi = chuoiMaMatHang.split(",");

      for (const maDangChuoi of cacMaDangChuoi) {
        const maMatHang = Number(maDangChuoi);

        if (Number.isInteger(maMatHang) === true) {
          if (maMatHang > 0) {
            mangMaMatHang.push(maMatHang);
          }
        }
      }
    }
  }

  // useNavigate trả về hàm dùng để chuyển trang bằng mã lệnh.
  const hamDieuHuong = useNavigate();

  // useQueryClient trả về bộ quản lý truy vấn để làm mới dữ liệu giỏ hàng.
  const boQuanLyTruyVan = useQueryClient();

  // Trạng thái này lưu tên người nhận đang nhập.
  const trangThaiNguoiNhan = useState("");

  // Biến này lưu tên người nhận hiện tại.
  const nguoiNhan = trangThaiNguoiNhan[0];

  // Biến này lưu hàm cập nhật tên người nhận.
  const capNhatNguoiNhan = trangThaiNguoiNhan[1];

  // Trạng thái này lưu số điện thoại đang nhập.
  const trangThaiSoDienThoai = useState("");

  // Biến này lưu số điện thoại hiện tại.
  const soDienThoai = trangThaiSoDienThoai[0];

  // Biến này lưu hàm cập nhật số điện thoại.
  const capNhatSoDienThoai = trangThaiSoDienThoai[1];

  // Trạng thái này lưu địa chỉ nhận hàng đang nhập.
  const trangThaiDiaChi = useState("");

  // Biến này lưu địa chỉ nhận hàng hiện tại.
  const diaChi = trangThaiDiaChi[0];

  // Biến này lưu hàm cập nhật địa chỉ nhận hàng.
  const capNhatDiaChi = trangThaiDiaChi[1];

  // Trạng thái này lưu tỉnh/thành phố nhận hàng đang chọn.
  const trangThaiTinhThanh = useState("");

  // Biến này lưu tỉnh/thành phố nhận hàng hiện tại.
  const tinhThanh = trangThaiTinhThanh[0];

  // Biến này lưu hàm cập nhật tỉnh/thành phố nhận hàng.
  const capNhatTinhThanh = trangThaiTinhThanh[1];

  // Trạng thái này lưu cổng thanh toán người dùng đã chọn.
  const trangThaiPhuongThucThanhToan = useState("COD");

  // Biến này lưu cổng thanh toán hiện tại.
  const phuongThucThanhToan = trangThaiPhuongThucThanhToan[0];

  // Biến này lưu hàm cập nhật cổng thanh toán.
  const capNhatPhuongThucThanhToan = trangThaiPhuongThucThanhToan[1];

  // Trạng thái này lưu mã địa chỉ đã lưu đang được chọn.
  const trangThaiMaDiaChi = useState("");

  // Biến này lưu mã địa chỉ đã lưu đang được chọn.
  const maDiaChiDangChon = trangThaiMaDiaChi[0];

  // Biến này lưu hàm cập nhật mã địa chỉ đang được chọn.
  const capNhatMaDiaChiDangChon = trangThaiMaDiaChi[1];

  // Trạng thái này lưu lỗi của từng trường trong biểu mẫu.
  const trangThaiLoiBieuMau = useState({});

  // Biến này lưu lỗi biểu mẫu hiện tại.
  const loiBieuMau = trangThaiLoiBieuMau[0];

  // Biến này lưu hàm cập nhật lỗi biểu mẫu.
  const capNhatLoiBieuMau = trangThaiLoiBieuMau[1];

  // Trạng thái này lưu lỗi phát sinh khi gửi đơn lên backend.
  const trangThaiLoiHeThong = useState(null);

  // Biến này lưu thông tin lỗi hệ thống hiện tại.
  const loiHeThong = trangThaiLoiHeThong[0];

  // Biến này lưu hàm cập nhật lỗi hệ thống.
  const capNhatLoiHeThong = trangThaiLoiHeThong[1];

  // Trạng thái này cho biết biểu mẫu đang gửi lên backend hay không.
  const trangThaiDangGui = useState(false);

  // Biến này lưu trạng thái đang gửi.
  const dangGui = trangThaiDangGui[0];

  // Biến này lưu hàm cập nhật trạng thái đang gửi.
  const capNhatDangGui = trangThaiDangGui[1];

  // Trạng thái này cho biết đơn hàng đã được tạo hay chưa.
  const trangThaiDaTaoDon = useState(false);

  // Biến này cho biết đơn hàng đã được tạo hay chưa.
  const daTaoDon = trangThaiDaTaoDon[0];

  // Biến này lưu hàm cập nhật trạng thái đã tạo đơn.
  const capNhatDaTaoDon = trangThaiDaTaoDon[1];

  // useRef lưu việc đã tự điền địa chỉ mặc định hay chưa.
  const thamChieuDaDienDiaChi = useRef(false);

  // useRef lưu mã người dùng của lần tải trước để biết khi nào tài khoản thay đổi.
  const thamChieuMaNguoiDung = useRef(maNguoiDung);

  // useState tạo khoá chống trùng một lần cho lượt đặt hàng này.
  const trangThaiKhoaChongTrung = useState(taoKhoaChongTrung);

  // Biến này lưu khoá chống trùng gửi kèm yêu cầu đặt hàng.
  const khoaChongTrung = trangThaiKhoaChongTrung[0];

  // Biến này lưu toàn bộ mặt hàng hiện có trong giỏ sau khi kiểm tra dữ liệu.
  let tatCaMatHang = [];

  const duLieuGioHang = ketQuaGioHang.data;

  // Nếu dữ liệu giỏ hàng trả về là một mảng thì mới dùng được.
  if (Array.isArray(duLieuGioHang) === true) {
    tatCaMatHang = duLieuGioHang;
  }

  // Mảng này chỉ giữ các mặt hàng khách đã chọn ở giỏ hàng.
  const danhSachMatHang = [];

  for (const matHang of tatCaMatHang) {
    if (mangMaMatHang.includes(matHang.id) === true) {
      danhSachMatHang.push(matHang);
    }
  }

  // Biến này lưu danh sách địa chỉ sau khi kiểm tra dữ liệu trả về.
  let danhSachDiaChi = [];

  const duLieuDiaChi = ketQuaDiaChi.data;

  // Nếu dữ liệu địa chỉ trả về là một mảng thì mới dùng được.
  if (Array.isArray(duLieuDiaChi) === true) {
    danhSachDiaChi = duLieuDiaChi;
  }

  // Biến này lưu tổng số sản phẩm trong giỏ.
  const tongSoLuong = tinhTongSoLuong(danhSachMatHang);

  // Biến này lưu tạm tính của giỏ hàng.
  const tamTinh = tinhTamTinh(danhSachMatHang);

  // Biến này lưu phí giao hàng theo tỉnh/thành đã chọn.
  const phiGiaoHang = tinhPhiGiaoHang(tinhThanh, tamTinh);

  // Biến này lưu tổng tiền khách phải trả, gồm cả phí giao hàng.
  const tongCong = tamTinh + phiGiaoHang;

  // Hàm này cập nhật tiêu đề tài liệu khi mở trang thanh toán.
  function xuLyCapNhatTieuDeTaiLieu() {
    document.title = "Thanh toán | MarketHub";

    // Hàm này khôi phục tiêu đề mặc định khi rời trang.
    function xuLyKhoiPhucTieuDe() {
      document.title = TIEU_DE_MAC_DINH;
    }

    return xuLyKhoiPhucTieuDe;
  }

  // useEffect cập nhật tiêu đề tài liệu sau khi trang được gắn vào giao diện.
  useEffect(xuLyCapNhatTieuDeTaiLieu, []);

  // useEffect tự điền địa chỉ mặc định đúng một lần khi danh sách địa chỉ tải xong.
  useEffect(
    function () {
      // Không điền lại nếu đã từng tự điền hoặc dữ liệu chưa phải một mảng.
      if (thamChieuDaDienDiaChi.current === true) {
        return;
      }

      if (Array.isArray(duLieuDiaChi) === false) {
        return;
      }

      if (duLieuDiaChi.length === 0) {
        return;
      }

      // Mặc định lấy địa chỉ đầu tiên, sau đó ưu tiên địa chỉ được đánh dấu mặc định.
      let diaChiMacDinh = duLieuDiaChi[0];

      for (const diaChiDaLuu of duLieuDiaChi) {
        if (diaChiDaLuu.defaultAddress === true) {
          diaChiMacDinh = diaChiDaLuu;
          break;
        }
      }

      thamChieuDaDienDiaChi.current = true;
      capNhatMaDiaChiDangChon(String(diaChiMacDinh.id));
      capNhatNguoiNhan(diaChiMacDinh.recipientName);
      capNhatSoDienThoai(diaChiMacDinh.phone);
      capNhatDiaChi(diaChiMacDinh.fullAddress);

      if (typeof diaChiMacDinh.province === "string") {
        capNhatTinhThanh(diaChiMacDinh.province);
      }
    },
    [
      duLieuDiaChi,
      capNhatDiaChi,
      capNhatMaDiaChiDangChon,
      capNhatNguoiNhan,
      capNhatSoDienThoai,
      capNhatTinhThanh,
    ],
  );

  // useEffect xoá biểu mẫu và cho phép tự điền lại khi người dùng đổi tài khoản.
  useEffect(
    function () {
      if (thamChieuMaNguoiDung.current === maNguoiDung) {
        return;
      }

      thamChieuMaNguoiDung.current = maNguoiDung;
      thamChieuDaDienDiaChi.current = false;
      capNhatMaDiaChiDangChon("");
      capNhatNguoiNhan("");
      capNhatSoDienThoai("");
      capNhatDiaChi("");
      capNhatTinhThanh("");
    },
    [
      maNguoiDung,
      capNhatDiaChi,
      capNhatMaDiaChiDangChon,
      capNhatNguoiNhan,
      capNhatSoDienThoai,
      capNhatTinhThanh,
    ],
  );

  // Hàm này cập nhật tên người nhận khi người dùng gõ.
  function xuLyThayDoiNguoiNhan(suKienNhap) {
    capNhatNguoiNhan(suKienNhap.target.value);
  }

  // Hàm này cập nhật số điện thoại khi người dùng gõ.
  function xuLyThayDoiSoDienThoai(suKienNhap) {
    capNhatSoDienThoai(suKienNhap.target.value);
  }

  // Hàm này cập nhật địa chỉ khi người dùng gõ.
  function xuLyThayDoiDiaChi(suKienNhap) {
    capNhatDiaChi(suKienNhap.target.value);
  }

  // Hàm này cập nhật tỉnh/thành phố khi người dùng chọn.
  function xuLyThayDoiTinhThanh(suKienChon) {
    capNhatTinhThanh(suKienChon.target.value);
  }

  // Hàm này cập nhật cổng thanh toán khi người dùng chọn.
  function xuLyChonPhuongThucThanhToan(suKienChon) {
    capNhatPhuongThucThanhToan(suKienChon.target.value);
  }

  // Hàm này điền thông tin của một địa chỉ đã lưu vào biểu mẫu.
  function dienThongTinDiaChi(diaChiDaLuu) {
    capNhatNguoiNhan(diaChiDaLuu.recipientName);
    capNhatSoDienThoai(diaChiDaLuu.phone);
    capNhatDiaChi(diaChiDaLuu.fullAddress);

    if (typeof diaChiDaLuu.province === "string") {
      capNhatTinhThanh(diaChiDaLuu.province);
    } else {
      capNhatTinhThanh("");
    }
  }

  // Hàm này xử lý khi người dùng chọn một địa chỉ đã lưu.
  function xuLyChonDiaChiDaLuu(suKienChon) {
    const giaTriChon = suKienChon.target.value;
    capNhatMaDiaChiDangChon(giaTriChon);

    // Nếu người dùng chọn dòng nhắc thì xoá biểu mẫu để nhập địa chỉ mới.
    if (giaTriChon === "") {
      capNhatNguoiNhan("");
      capNhatSoDienThoai("");
      capNhatDiaChi("");
      capNhatTinhThanh("");
      return;
    }

    const maDiaChi = Number(giaTriChon);

    for (const diaChiDaLuu of danhSachDiaChi) {
      if (diaChiDaLuu.id === maDiaChi) {
        dienThongTinDiaChi(diaChiDaLuu);
        return;
      }
    }
  }

  // Hàm này gửi đơn hàng lên backend rồi chuyển sang cổng thanh toán.
  async function xuLyGuiDatHang(suKienGui) {
    suKienGui.preventDefault();

    // Chặn bấm đúp khi đơn hàng đang được xử lý.
    if (dangGui === true) {
      return;
    }

    // Kiểm tra thông tin nhận hàng trước khi gọi backend.
    const loiMoi = kiemTraThongTinDatHang(
      nguoiNhan,
      soDienThoai,
      diaChi,
      tinhThanh,
    );

    if (Object.keys(loiMoi).length > 0) {
      capNhatLoiBieuMau(loiMoi);
      capNhatLoiHeThong(null);
      return;
    }

    if (mangMaMatHang.length === 0) {
      capNhatLoiHeThong({
        thongDiep: "Vui lòng chọn sản phẩm trong giỏ trước khi thanh toán.",
        laLoiGioHang: true,
        laLoiHetPhien: false,
      });
      return;
    }

    capNhatLoiBieuMau({});
    capNhatLoiHeThong(null);
    capNhatDangGui(true);

    // Dữ liệu này chỉ chứa thông tin nhận hàng và cổng thanh toán.
    // Backend tự đọc giỏ hàng và tính tiền, không tin số liệu từ trình duyệt.
    const duLieuDatHang = {
      recipientName: nguoiNhan.trim(),
      phone: soDienThoai.trim(),
      fullAddress: diaChi.trim(),
      province: tinhThanh,
      paymentMethod: phuongThucThanhToan,
      cartItemIds: mangMaMatHang,
      idempotencyKey: khoaChongTrung,
    };

    try {
      const ketQuaDatHang = await datHang(duLieuDatHang);
      capNhatDaTaoDon(true);
      boQuanLyTruyVan.invalidateQueries({ queryKey: ["cart"] });

      // Biến này cho biết trình duyệt đã được chuyển sang cổng thanh toán hay chưa.
      let daChuyenSangCongThanhToan = false;

      // Đơn COD không cần tạo giao dịch trực tuyến.
      if (phuongThucThanhToan !== "COD") {
        // Cố gắng tạo đường dẫn thanh toán ngay sau khi đơn được ghi nhận.
        try {
          const duLieuThanhToan = {
            checkoutSessionId: ketQuaDatHang.checkoutSessionId,
            provider: ketQuaDatHang.paymentMethod,
          };

          const ketQuaThanhToan = await taoDuongDanThanhToan(duLieuThanhToan);

          // Biến này lưu đường dẫn chuyển sang cổng thanh toán.
          let duongDanThanhToan = "";

          if (typeof ketQuaThanhToan.redirectUrl === "string") {
            duongDanThanhToan = ketQuaThanhToan.redirectUrl;
          }

          if (duongDanThanhToan !== "") {
            window.location.assign(duongDanThanhToan);
            daChuyenSangCongThanhToan = true;
          }
        } catch {
          // Lỗi tạo giao dịch được xử lý ở trang kết quả để người dùng thử lại.
        }
      }

      // Nếu chưa chuyển được sang cổng thanh toán thì mở trang kết quả đặt hàng.
      if (daChuyenSangCongThanhToan === false) {
        const duongDanKetQua =
          "/checkout/result?checkoutId=" + ketQuaDatHang.checkoutSessionId;
        hamDieuHuong(duongDanKetQua);
      }
    } catch (loi) {
      const thongDiepMacDinh = "Không đặt được hàng. Vui lòng thử lại.";
      const thongDiepLoi = layThongDiepLoiBackend(loi, thongDiepMacDinh);

      // Lỗi giỏ hàng cần tải lại dữ liệu để hiển thị tồn kho mới nhất.
      const laLoiGioHang = kiemTraLaLoiGioHang(loi);

      // Lỗi 401 cần mời người dùng đăng nhập lại.
      const laLoiHetPhien = kiemTraLaLoiHetPhien(loi);

      const thongTinLoi = {
        thongDiep: thongDiepLoi,
        laLoiGioHang: laLoiGioHang,
        laLoiHetPhien: laLoiHetPhien,
      };

      capNhatLoiHeThong(thongTinLoi);

      if (laLoiGioHang === true) {
        boQuanLyTruyVan.invalidateQueries({ queryKey: ["cart"] });
      }

      capNhatDangGui(false);
      capNhatDaTaoDon(false);
    }
  }

  // Hàm này gọi lại API giỏ hàng khi người dùng bấm thử lại.
  function xuLyThuLaiGioHang() {
    ketQuaGioHang.refetch();
  }

  // Mảng này lưu các lựa chọn của ô địa chỉ đã lưu.
  const cacLuaChonDiaChi = [];

  // Biến này lưu nhãn của lựa chọn đầu tiên trong ô địa chỉ.
  let nhanLuaChonDiaChiDau = "Chọn địa chỉ đã lưu";

  if (ketQuaDiaChi.isLoading === true) {
    nhanLuaChonDiaChiDau = "Đang tải địa chỉ…";
  } else if (ketQuaDiaChi.isError === true) {
    nhanLuaChonDiaChiDau = "Không tải được địa chỉ đã lưu";
  } else if (danhSachDiaChi.length === 0) {
    nhanLuaChonDiaChiDau = "Chưa có địa chỉ đã lưu — nhập bên dưới";
  }

  cacLuaChonDiaChi.push(
    <option key="khong-chon-dia-chi" value="">
      {nhanLuaChonDiaChiDau}
    </option>,
  );

  // Tạo từng lựa chọn cho các địa chỉ đã lưu.
  for (const diaChiDaLuu of danhSachDiaChi) {
    let nhanDiaChi =
      diaChiDaLuu.recipientName + " — " + diaChiDaLuu.fullAddress;

    if (diaChiDaLuu.defaultAddress === true) {
      nhanDiaChi = "[Mặc định] " + nhanDiaChi;
    }

    cacLuaChonDiaChi.push(
      <option key={diaChiDaLuu.id} value={diaChiDaLuu.id}>
        {nhanDiaChi}
      </option>,
    );
  }

  // Mảng này lưu các nhóm tỉnh/thành để hiển thị trong ô chọn.
  const cacNhomTinhThanh = [];

  for (const nhomTinhThanh of NHOM_TINH_THANH) {
    // Mảng này lưu các lựa chọn thuộc một miền.
    const cacLuaChonTinh = [];

    for (const tenTinh of nhomTinhThanh.tinhThanh) {
      cacLuaChonTinh.push(
        <option key={tenTinh} value={tenTinh}>
          {tenTinh}
        </option>,
      );
    }

    cacNhomTinhThanh.push(
      <optgroup key={nhomTinhThanh.nhan} label={nhomTinhThanh.nhan}>
        {cacLuaChonTinh}
      </optgroup>,
    );
  }

  // Phần tử này hiển thị cảnh báo khi không tải được địa chỉ đã lưu.
  let phanTuLoiDiaChi = null;

  if (ketQuaDiaChi.isError === true) {
    phanTuLoiDiaChi = (
      <div className="alert checkout-address-alert" role="status">
        <CircleAlert className="icon icon--sm" />
        <div>
          Không tải được địa chỉ đã lưu. Bạn vẫn có thể nhập tay bên dưới.
        </div>
      </div>
    );
  }

  // Phần tử này hiển thị lỗi đặt hàng do backend trả về.
  let phanTuLoiHeThong = null;

  if (loiHeThong !== null) {
    // Phần tử này hiển thị gợi ý phù hợp với loại lỗi.
    let phanTuGoiY = null;

    if (loiHeThong.laLoiGioHang === true) {
      phanTuGoiY = (
        <div className="muted">
          Vui lòng kiểm tra lại <Link to="/cart">giỏ hàng</Link>.
        </div>
      );
    }

    if (loiHeThong.laLoiHetPhien === true) {
      phanTuGoiY = (
        <div className="muted">
          <Link to="/login?redirect=/checkout">Đăng nhập lại</Link> để tiếp tục.
        </div>
      );
    }

    phanTuLoiHeThong = (
      <div className="alert alert--danger checkout-error" role="alert">
        <CircleAlert className="icon icon--sm" />
        <div>
          <strong>Không đặt được hàng</strong>
          <div>{loiHeThong.thongDiep}</div>
          {phanTuGoiY}
        </div>
      </div>
    );
  }

  // Mảng này lưu các dòng mặt hàng trong phần tóm tắt đơn.
  const cacDongDonHang = [];

  // Tạo từng dòng tóm tắt cho mặt hàng đang có trong giỏ.
  for (const matHang of danhSachMatHang) {
    // Biến này lưu mô tả biến thể và số lượng của mặt hàng.
    let nhanBienThe = "SL " + matHang.quantity;
    const chuoiThuocTinh = taoChuoiThuocTinh(matHang.attributes);

    if (chuoiThuocTinh !== "") {
      nhanBienThe = chuoiThuocTinh + " · SL " + matHang.quantity;
    }

    cacDongDonHang.push(
      <div className="order-mini__item" key={matHang.id}>
        <AnhDonHangNho matHang={matHang} />
        <span>
          <span className="order-mini__name">{matHang.productName}</span>
          <span className="order-mini__qty">{nhanBienThe}</span>
        </span>
        <span className="order-mini__price">
          {dinhDangTien(tinhTienMotDong(matHang))}
        </span>
      </div>,
    );
  }

  // Biến này cho biết trường tên người nhận có lỗi hay không.
  let nguoiNhanCoLoi = false;

  if (loiBieuMau.recipientName !== undefined) {
    nguoiNhanCoLoi = true;
  }

  // Biến này cho biết trường số điện thoại có lỗi hay không.
  let soDienThoaiCoLoi = false;

  if (loiBieuMau.phone !== undefined) {
    soDienThoaiCoLoi = true;
  }

  // Biến này cho biết trường địa chỉ có lỗi hay không.
  let diaChiCoLoi = false;

  if (loiBieuMau.fullAddress !== undefined) {
    diaChiCoLoi = true;
  }

  // Biến này cho biết trường tỉnh/thành phố có lỗi hay không.
  let tinhThanhCoLoi = false;

  if (loiBieuMau.province !== undefined) {
    tinhThanhCoLoi = true;
  }

  // Biến này lưu nhãn phí giao hàng trong phần tóm tắt.
  let nhanPhiGiaoHang = "Chọn tỉnh/thành phố";

  if (laTinhThanhHoTro(tinhThanh) === true) {
    if (phiGiaoHang === 0) {
      nhanPhiGiaoHang = "Miễn phí";
    } else {
      nhanPhiGiaoHang = dinhDangTien(phiGiaoHang);
    }
  }

  // Biến này lưu ghi chú dưới phần chọn phương thức thanh toán.
  let ghiChuThanhToan =
    "Đơn hàng được ghi nhận ngay sau khi đặt. Bạn sẽ được chuyển đến cổng thanh toán tương ứng để hoàn tất.";

  if (phuongThucThanhToan === "COD") {
    ghiChuThanhToan =
      "Bạn thanh toán bằng tiền mặt cho nhân viên giao hàng khi nhận được hàng.";
  }

  // Biến này lưu nhãn của nút đặt hàng.
  let nhanNutDatHang = "Đặt hàng · " + dinhDangTien(tongCong);

  if (dangGui === true) {
    if (daTaoDon === true) {
      if (phuongThucThanhToan === "COD") {
        nhanNutDatHang = "Đang hoàn tất đơn hàng…";
      } else {
        nhanNutDatHang = "Đang chuyển đến cổng thanh toán…";
      }
    } else {
      nhanNutDatHang = "Đang đặt hàng…";
    }
  }

  // Phần tử này hiển thị nội dung chính theo trạng thái của trang.
  let noiDungChinh;

  // Nếu chưa đăng nhập thì yêu cầu đăng nhập trước khi thanh toán.
  if (daDangNhap === false) {
    noiDungChinh = (
      <div className="catalog-state">
        <h2>Đăng nhập để thanh toán</h2>
        <p>Thông tin nhận hàng và giỏ hàng được gắn với tài khoản MarketHub.</p>
        <Link className="btn btn--primary" to="/login?redirect=/checkout">
          Đăng nhập
        </Link>
      </div>
    );
  } else if (daTaoDon === true) {
    // Biến này lưu mô tả trạng thái sau khi đơn đã được ghi nhận.
    let moTaHoanTat = "Đơn hàng đã được ghi nhận. Vui lòng không đóng trình duyệt.";

    if (phuongThucThanhToan === "COD") {
      moTaHoanTat =
        "Đơn hàng đã được ghi nhận. Bạn sẽ thanh toán khi nhận hàng.";
    }

    noiDungChinh = (
      <div className="catalog-state" role="status">
        <h2>Đang hoàn tất đơn hàng…</h2>
        <p>{moTaHoanTat}</p>
      </div>
    );
  } else if (ketQuaGioHang.isLoading === true) {
    noiDungChinh = (
      <div className="catalog-state" role="status">
        <h2>Đang tải giỏ hàng…</h2>
        <p>Dữ liệu đang được lấy từ MarketHub.</p>
      </div>
    );
  } else if (ketQuaGioHang.isError === true) {
    // Biến này cho biết lỗi có phải do phiên đăng nhập đã hết hạn hay không.
    const laLoiHetPhien = kiemTraLaLoiHetPhien(ketQuaGioHang.error);

    // Biến này lưu tiêu đề của trạng thái lỗi.
    let tieuDeLoi = "Không tải được giỏ hàng";

    // Biến này lưu mô tả của trạng thái lỗi.
    let moTaLoi = "Kiểm tra backend và MySQL đang chạy, sau đó thử lại.";

    // Phần tử này hiển thị hành động phù hợp với loại lỗi.
    let phanTuHanhDong = (
      <button className="btn" type="button" onClick={xuLyThuLaiGioHang}>
        Thử lại
      </button>
    );

    // Nếu phiên đăng nhập hết hạn thì mời người dùng đăng nhập lại.
    if (laLoiHetPhien === true) {
      tieuDeLoi = "Phiên đăng nhập đã hết hạn";
      moTaLoi = "Vui lòng đăng nhập lại để thanh toán.";

      phanTuHanhDong = (
        <Link className="btn btn--primary" to="/login?redirect=/checkout">
          Đăng nhập lại
        </Link>
      );
    }

    noiDungChinh = (
      <div className="catalog-state" role="alert">
        <h2>{tieuDeLoi}</h2>
        <p>{moTaLoi}</p>
        {phanTuHanhDong}
      </div>
    );
  } else if (mangMaMatHang.length === 0) {
    noiDungChinh = (
      <div className="catalog-state">
        <h2>Chưa chọn sản phẩm để thanh toán</h2>
        <p>
          Hãy quay lại giỏ hàng và tích chọn những món bạn muốn mua. Chúng tôi
          không tự thanh toán toàn bộ giỏ.
        </p>
        <Link className="btn btn--primary" to="/cart">
          Chọn sản phẩm trong giỏ
        </Link>
      </div>
    );
  } else if (danhSachMatHang.length === 0) {
    noiDungChinh = (
      <div className="catalog-state">
        <h2>Sản phẩm đã chọn không còn trong giỏ</h2>
        <p>Có thể sản phẩm đã bị xoá hoặc giỏ hàng vừa thay đổi.</p>
        <Link className="btn btn--primary" to="/cart">
          Quay lại giỏ hàng
        </Link>
      </div>
    );
  } else {
    noiDungChinh = (
      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={xuLyGuiDatHang}
          noValidate
        >
          <section className="checkout-section">
            <div className="checkout-section__head">
              <h2>Thông tin nhận hàng</h2>
              <Link to="/account">Quản lý địa chỉ</Link>
            </div>

            <div className="form-grid">
              <div className="field span-2">
                <label htmlFor="checkout-saved-address">
                  Địa chỉ đã lưu
                </label>
                <select
                  className="select"
                  id="checkout-saved-address"
                  value={maDiaChiDangChon}
                  onChange={xuLyChonDiaChiDaLuu}
                  disabled={dangGui}
                >
                  {cacLuaChonDiaChi}
                </select>
              </div>

              <div className="field">
                <label className="required" htmlFor="checkout-recipient-name">
                  Người nhận
                </label>
                <input
                  className="input"
                  id="checkout-recipient-name"
                  name="recipientName"
                  type="text"
                  autoComplete="name"
                  maxLength="120"
                  value={nguoiNhan}
                  onChange={xuLyThayDoiNguoiNhan}
                  aria-invalid={nguoiNhanCoLoi}
                  disabled={dangGui}
                />
                <LoiTruong noiDung={loiBieuMau.recipientName} />
              </div>

              <div className="field">
                <label className="required" htmlFor="checkout-phone">
                  Số điện thoại
                </label>
                <input
                  className="input"
                  id="checkout-phone"
                  name="phone"
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength="11"
                  value={soDienThoai}
                  onChange={xuLyThayDoiSoDienThoai}
                  aria-invalid={soDienThoaiCoLoi}
                  disabled={dangGui}
                />
                <LoiTruong noiDung={loiBieuMau.phone} />
              </div>

              <div className="field span-2">
                <label className="required" htmlFor="checkout-full-address">
                  Địa chỉ
                </label>
                <textarea
                  className="textarea"
                  id="checkout-full-address"
                  name="fullAddress"
                  rows="3"
                  autoComplete="street-address"
                  maxLength="500"
                  value={diaChi}
                  onChange={xuLyThayDoiDiaChi}
                  aria-invalid={diaChiCoLoi}
                  disabled={dangGui}
                />
                <LoiTruong noiDung={loiBieuMau.fullAddress} />
              </div>

              <div className="field span-2">
                <label className="required" htmlFor="checkout-province">
                  Tỉnh/thành phố
                </label>
                <select
                  className="select"
                  id="checkout-province"
                  name="province"
                  value={tinhThanh}
                  onChange={xuLyThayDoiTinhThanh}
                  aria-invalid={tinhThanhCoLoi}
                  disabled={dangGui}
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {cacNhomTinhThanh}
                </select>
                <span className="field-hint">
                  Đơn từ 499.000₫ miễn phí toàn quốc. Dưới ngưỡng: miền Nam
                  0₫, miền Trung 10.000₫, miền Bắc 20.000₫.
                </span>
                <LoiTruong noiDung={loiBieuMau.province} />
              </div>
            </div>

            {phanTuLoiDiaChi}
          </section>

          <section className="checkout-section">
            <div className="checkout-section__head">
              <h2>Phương thức thanh toán</h2>
            </div>

            <fieldset className="pay-options">
              <legend className="sr-only">Chọn phương thức thanh toán</legend>

              <label className="pay-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={phuongThucThanhToan === "COD"}
                  onChange={xuLyChonPhuongThucThanhToan}
                  disabled={dangGui}
                />
                <span className="pay-option__body">
                  <span className="pay-option__name">
                    Thanh toán khi nhận hàng (COD)
                  </span>
                  <span className="pay-option__hint">
                    Kiểm tra hàng rồi mới trả tiền cho nhân viên giao hàng.
                  </span>
                </span>
                <span className="pay-option__mark">COD</span>
              </label>

              <label className="pay-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VNPAY"
                  checked={phuongThucThanhToan === "VNPAY"}
                  onChange={xuLyChonPhuongThucThanhToan}
                  disabled={dangGui}
                />
                <span className="pay-option__body">
                  <span className="pay-option__name">VNPay</span>
                  <span className="pay-option__hint">
                    Thanh toán bằng thẻ ATM, Visa, Mastercard hoặc QR.
                  </span>
                </span>
                <span className="pay-option__mark">VNPAY</span>
              </label>

              <label className="pay-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="MOMO"
                  checked={phuongThucThanhToan === "MOMO"}
                  onChange={xuLyChonPhuongThucThanhToan}
                  disabled={dangGui}
                />
                <span className="pay-option__body">
                  <span className="pay-option__name">MoMo</span>
                  <span className="pay-option__hint">
                    Thanh toán bằng ví MoMo hoặc QR.
                  </span>
                </span>
                <span className="pay-option__mark">MoMo</span>
              </label>
            </fieldset>

            <p className="checkout-legal">{ghiChuThanhToan}</p>
          </section>

          {phanTuLoiHeThong}

          <div className="checkout-actions">
            <button
              className="btn btn--primary btn--block"
              type="submit"
              disabled={dangGui}
            >
              {nhanNutDatHang}
            </button>
          </div>

          <p className="checkout-legal">
            Bằng việc đặt hàng, bạn đồng ý với điều khoản mua bán và chính sách
            đổi trả của MarketHub.
          </p>
        </form>

        <aside className="summary" aria-label="Đơn hàng của bạn">
          <h2>Đơn hàng của bạn</h2>

          <div className="order-mini">{cacDongDonHang}</div>

          <div className="summary__rows">
            <div className="summary__row">
              <span>Tạm tính ({tongSoLuong} sản phẩm)</span>
              <span>{dinhDangTien(tamTinh)}</span>
            </div>
            <div className="summary__row">
              <span>Phí giao hàng</span>
              <span>{nhanPhiGiaoHang}</span>
            </div>
            <div className="summary__row summary__row--total">
              <span>Tổng cộng</span>
              <span>{dinhDangTien(tongCong)}</span>
            </div>
          </div>

          <p className="summary__note">
            <ShieldCheck className="icon icon--sm" />
            Giao hàng toàn quốc · Đổi trả 30 ngày.
          </p>
        </aside>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Thanh toán</h1>
        </div>
        <div className="page-head__aside">
          <Link className="link" to="/cart">
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>

      <div className="steps" aria-label="Các bước thanh toán">
        <span className="step" aria-current="step">
          <span className="step__no">1</span> Thông tin nhận hàng
        </span>
        <span className="step__sep" aria-hidden="true"></span>
        <span className="step">
          <span className="step__no">2</span> Thanh toán
        </span>
        <span className="step__sep" aria-hidden="true"></span>
        <span className="step">
          <span className="step__no">3</span> Hoàn tất
        </span>
      </div>

      {noiDungChinh}
    </div>
  );
}
