import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CircleAlert,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  capNhatDiaChi,
  datDiaChiMacDinh,
  taoDiaChiMoi,
  xoaDiaChi,
} from "../api/addressApi.js";
import { capNhatThongTinCaNhan } from "../api/authApi.js";
import { useAuth } from "../hooks/useAuth.js";
import { useDanhSachDiaChi } from "../hooks/useCheckout.js";
import { useHoSoCaNhan } from "../hooks/useProfile.js";
import {
  docNguoiDungDangNhap,
  docTokenDangNhap,
  luuPhienDangNhap,
  xoaPhienDangNhap,
} from "../lib/authStorage.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import {
  NHOM_TINH_THANH,
  laTinhThanhHoTro,
} from "../lib/shipping.js";

// Tiêu đề mặc định của tài liệu khi rời trang tài khoản.
const TIEU_DE_MAC_DINH = "Tất cả sản phẩm | MarketHub";

// Hàm này ghép họ và tên thành một chuỗi họ tên đầy đủ.
function taoHoTenDayDu(ho, ten) {
  // Biến này lưu phần họ đã được làm sạch.
  let phanHo = "";

  if (typeof ho === "string") {
    phanHo = ho.trim();
  }

  // Biến này lưu phần tên đã được làm sạch.
  let phanTen = "";

  if (typeof ten === "string") {
    phanTen = ten.trim();
  }

  return (phanHo + " " + phanTen).trim();
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

// Hàm này lấy số điện thoại từ hồ sơ và trả về chuỗi rỗng nếu chưa có.
function laySoDienThoaiHoSo(soDienThoai) {
  if (typeof soDienThoai === "string") {
    return soDienThoai;
  }

  return "";
}

// Hàm này lấy ngày sinh từ hồ sơ và trả về chuỗi rỗng nếu chưa có.
function layNgaySinhHoSo(ngaySinh) {
  if (typeof ngaySinh === "string") {
    return ngaySinh;
  }

  return "";
}

// Thành phần này hiển thị trang tài khoản của cửa hàng.
export default function TrangTaiKhoan() {
  // useAuth trả về trạng thái đăng nhập hiện tại.
  const trangThaiDangNhap = useAuth();

  // Biến này cho biết người dùng đã đăng nhập hay chưa.
  const daDangNhap = trangThaiDangNhap.daDangNhap;

  // useQueryClient trả về bộ quản lý dữ liệu truy vấn dùng chung.
  const boQuanLyTruyVan = useQueryClient();

  // Hook này gọi API lấy hồ sơ cá nhân của người đang đăng nhập.
  const ketQuaHoSo = useHoSoCaNhan(daDangNhap);

  // Hook này gọi API lấy danh sách địa chỉ đã lưu của người đang đăng nhập.
  const ketQuaDiaChi = useDanhSachDiaChi(daDangNhap);

  // useRef lưu việc đã điền hồ sơ vào biểu mẫu hay chưa.
  const thamChieuDaDienHoSo = useRef(false);

  // Trạng thái này lưu họ người dùng đang sửa.
  const trangThaiHo = useState("");

  // Biến này lưu họ đang nhập.
  const hoDangNhap = trangThaiHo[0];

  // Biến này lưu hàm cập nhật họ.
  const capNhatHo = trangThaiHo[1];

  // Trạng thái này lưu tên người dùng đang sửa.
  const trangThaiTen = useState("");

  // Biến này lưu tên đang nhập.
  const tenDangNhap = trangThaiTen[0];

  // Biến này lưu hàm cập nhật tên.
  const capNhatTen = trangThaiTen[1];

  // Trạng thái này lưu email hiển thị trên biểu mẫu.
  const trangThaiEmail = useState("");

  // Biến này lưu email hiện tại.
  const emailHienTai = trangThaiEmail[0];

  // Biến này lưu hàm cập nhật email.
  const capNhatEmail = trangThaiEmail[1];

  // Trạng thái này lưu số điện thoại người dùng đang sửa.
  const trangThaiSoDienThoai = useState("");

  // Biến này lưu số điện thoại đang nhập.
  const soDienThoaiDangNhap = trangThaiSoDienThoai[0];

  // Biến này lưu hàm cập nhật số điện thoại.
  const capNhatSoDienThoai = trangThaiSoDienThoai[1];

  // Trạng thái này lưu ngày sinh người dùng đang sửa.
  const trangThaiNgaySinh = useState("");

  // Biến này lưu ngày sinh đang nhập.
  const ngaySinhDangNhap = trangThaiNgaySinh[0];

  // Biến này lưu hàm cập nhật ngày sinh.
  const capNhatNgaySinh = trangThaiNgaySinh[1];

  // Trạng thái này lưu lỗi của biểu mẫu hồ sơ.
  const trangThaiLoiHoSo = useState("");

  // Biến này lưu nội dung lỗi hồ sơ hiện tại.
  const loiHoSo = trangThaiLoiHoSo[0];

  // Biến này lưu hàm cập nhật lỗi hồ sơ.
  const capNhatLoiHoSo = trangThaiLoiHoSo[1];

  // Trạng thái này lưu thông báo lưu hồ sơ thành công.
  const trangThaiThongBaoHoSo = useState("");

  // Biến này lưu thông báo hồ sơ hiện tại.
  const thongBaoHoSo = trangThaiThongBaoHoSo[0];

  // Biến này lưu hàm cập nhật thông báo hồ sơ.
  const capNhatThongBaoHoSo = trangThaiThongBaoHoSo[1];

  // Trạng thái này cho biết biểu mẫu hồ sơ đang gửi lên backend hay không.
  const trangThaiDangLuuHoSo = useState(false);

  // Biến này lưu trạng thái đang lưu hồ sơ.
  const dangLuuHoSo = trangThaiDangLuuHoSo[0];

  // Biến này lưu hàm cập nhật trạng thái đang lưu hồ sơ.
  const capNhatDangLuuHoSo = trangThaiDangLuuHoSo[1];

  // Trạng thái này cho biết biểu mẫu địa chỉ có đang mở hay không.
  const trangThaiMoFormDiaChi = useState(false);

  // Biến này cho biết biểu mẫu địa chỉ đang mở.
  const dangMoFormDiaChi = trangThaiMoFormDiaChi[0];

  // Biến này lưu hàm cập nhật trạng thái mở biểu mẫu địa chỉ.
  const capNhatMoFormDiaChi = trangThaiMoFormDiaChi[1];

  // Trạng thái này lưu mã địa chỉ đang sửa, bằng 0 khi thêm mới.
  const trangThaiMaDiaChiDangSua = useState(0);

  // Biến này lưu mã địa chỉ đang sửa.
  const maDiaChiDangSua = trangThaiMaDiaChiDangSua[0];

  // Biến này lưu hàm cập nhật mã địa chỉ đang sửa.
  const capNhatMaDiaChiDangSua = trangThaiMaDiaChiDangSua[1];

  // Trạng thái này lưu tên người nhận trong biểu mẫu địa chỉ.
  const trangThaiTenNguoiNhan = useState("");

  // Biến này lưu tên người nhận đang nhập.
  const tenNguoiNhan = trangThaiTenNguoiNhan[0];

  // Biến này lưu hàm cập nhật tên người nhận.
  const capNhatTenNguoiNhan = trangThaiTenNguoiNhan[1];

  // Trạng thái này lưu số điện thoại nhận hàng trong biểu mẫu địa chỉ.
  const trangThaiSoDienThoaiNhan = useState("");

  // Biến này lưu số điện thoại nhận hàng đang nhập.
  const soDienThoaiNhan = trangThaiSoDienThoaiNhan[0];

  // Biến này lưu hàm cập nhật số điện thoại nhận hàng.
  const capNhatSoDienThoaiNhan = trangThaiSoDienThoaiNhan[1];

  // Trạng thái này lưu địa chỉ đầy đủ trong biểu mẫu địa chỉ.
  const trangThaiDiaChiDayDu = useState("");

  // Biến này lưu địa chỉ đầy đủ đang nhập.
  const diaChiDayDu = trangThaiDiaChiDayDu[0];

  // Biến này lưu hàm cập nhật địa chỉ đầy đủ.
  const capNhatDiaChiDayDu = trangThaiDiaChiDayDu[1];

  // Trạng thái này lưu tỉnh/thành phố của địa chỉ đang nhập.
  const trangThaiTinhThanhNhan = useState("");

  // Biến này lưu tỉnh/thành phố của địa chỉ đang nhập.
  const tinhThanhNhan = trangThaiTinhThanhNhan[0];

  // Biến này lưu hàm cập nhật tỉnh/thành phố của địa chỉ.
  const capNhatTinhThanhNhan = trangThaiTinhThanhNhan[1];

  // Trạng thái này lưu lỗi của biểu mẫu địa chỉ.
  const trangThaiLoiDiaChi = useState("");

  // Biến này lưu nội dung lỗi địa chỉ hiện tại.
  const loiDiaChi = trangThaiLoiDiaChi[0];

  // Biến này lưu hàm cập nhật lỗi địa chỉ.
  const capNhatLoiDiaChi = trangThaiLoiDiaChi[1];

  // Trạng thái này lưu thông báo thao tác địa chỉ thành công.
  const trangThaiThongBaoDiaChi = useState("");

  // Biến này lưu thông báo địa chỉ hiện tại.
  const thongBaoDiaChi = trangThaiThongBaoDiaChi[0];

  // Biến này lưu hàm cập nhật thông báo địa chỉ.
  const capNhatThongBaoDiaChi = trangThaiThongBaoDiaChi[1];

  // Trạng thái này cho biết biểu mẫu địa chỉ đang gửi lên backend hay không.
  const trangThaiDangLuuDiaChi = useState(false);

  // Biến này lưu trạng thái đang lưu địa chỉ.
  const dangLuuDiaChi = trangThaiDangLuuDiaChi[0];

  // Biến này lưu hàm cập nhật trạng thái đang lưu địa chỉ.
  const capNhatDangLuuDiaChi = trangThaiDangLuuDiaChi[1];

  // Trạng thái này lưu mã địa chỉ đang được xử lý (xoá hoặc đặt mặc định).
  const trangThaiMaDiaChiDangXuLy = useState(0);

  // Biến này lưu mã địa chỉ đang được xử lý.
  const maDiaChiDangXuLy = trangThaiMaDiaChiDangXuLy[0];

  // Biến này lưu hàm cập nhật mã địa chỉ đang xử lý.
  const capNhatMaDiaChiDangXuLy = trangThaiMaDiaChiDangXuLy[1];

  // Hàm này cập nhật tiêu đề tài liệu khi mở trang tài khoản.
  function xuLyCapNhatTieuDeTaiLieu() {
    document.title = "Tài khoản | MarketHub";

    // Hàm này khôi phục tiêu đề mặc định khi rời trang.
    function xuLyKhoiPhucTieuDe() {
      document.title = TIEU_DE_MAC_DINH;
    }

    return xuLyKhoiPhucTieuDe;
  }

  // useEffect cập nhật tiêu đề tài liệu sau khi trang được gắn vào giao diện.
  useEffect(xuLyCapNhatTieuDeTaiLieu, []);

  // Hàm này xoá phiên đăng nhập khi người dùng chọn đăng xuất.
  function xuLyDangXuat() {
    xoaPhienDangNhap();
  }

  // useEffect đổ dữ liệu hồ sơ thật vào biểu mẫu trong lần tải đầu tiên.
  useEffect(
    function () {
      // Chỉ điền biểu mẫu một lần để không ghi đè nội dung người dùng đang sửa.
      if (thamChieuDaDienHoSo.current === true) {
        return;
      }

      const duLieuHoSo = ketQuaHoSo.data;

      if (duLieuHoSo === undefined) {
        return;
      }

      if (duLieuHoSo === null) {
        return;
      }

      // Biến này lưu họ lấy từ hồ sơ thật.
      let hoTuHoSo = "";

      if (typeof duLieuHoSo.firstName === "string") {
        hoTuHoSo = duLieuHoSo.firstName;
      }

      // Biến này lưu tên lấy từ hồ sơ thật.
      let tenTuHoSo = "";

      if (typeof duLieuHoSo.lastName === "string") {
        tenTuHoSo = duLieuHoSo.lastName;
      }

      // Biến này lưu email lấy từ hồ sơ thật.
      let emailTuHoSo = "";

      if (typeof duLieuHoSo.email === "string") {
        emailTuHoSo = duLieuHoSo.email;
      }

      capNhatHo(hoTuHoSo);
      capNhatTen(tenTuHoSo);
      capNhatEmail(emailTuHoSo);
      capNhatSoDienThoai(laySoDienThoaiHoSo(duLieuHoSo.phone));
      capNhatNgaySinh(layNgaySinhHoSo(duLieuHoSo.dateOfBirth));
      thamChieuDaDienHoSo.current = true;
    },
    [ketQuaHoSo.data, capNhatHo, capNhatTen, capNhatEmail, capNhatSoDienThoai, capNhatNgaySinh],
  );

  // Hàm này lưu thông tin hồ sơ mới vào trình duyệt để header đổi tên ngay.
  function capNhatNguoiDungTrongTrinhDuyet(hoSoMoi) {
    // Biến này lưu token đang dùng của phiên đăng nhập.
    const tokenDangDung = docTokenDangNhap();

    if (tokenDangDung === null) {
      return;
    }

    // Biến này lưu thông tin người dùng cũ đang lưu trong trình duyệt.
    const nguoiDungCu = docNguoiDungDangNhap();

    // Biến này lưu mã người dùng hiển thị trên header.
    let maNguoiDung = hoSoMoi.id;

    // Biến này lưu ảnh đại diện của người dùng.
    let anhDaiDien = null;

    // Biến này lưu vai trò của người dùng.
    let vaiTroNguoiDung = "USER";

    if (nguoiDungCu !== null) {
      if (typeof nguoiDungCu.avatar === "string") {
        anhDaiDien = nguoiDungCu.avatar;
      }

      if (typeof nguoiDungCu.role === "string") {
        vaiTroNguoiDung = nguoiDungCu.role;
      }
    }

    if (typeof hoSoMoi.avatar === "string") {
      anhDaiDien = hoSoMoi.avatar;
    }

    if (typeof hoSoMoi.role === "string") {
      vaiTroNguoiDung = hoSoMoi.role;
    }

    // Biến này lưu họ tên đầy đủ mới của người dùng.
    const hoTenMoi = taoHoTenDayDu(hoSoMoi.firstName, hoSoMoi.lastName);

    // Đối tượng này là thông tin người dùng mới được lưu lại.
    const nguoiDungMoi = {
      id: maNguoiDung,
      email: hoSoMoi.email,
      fullName: hoTenMoi,
      phone: hoSoMoi.phone,
      avatar: anhDaiDien,
      role: vaiTroNguoiDung,
    };

    luuPhienDangNhap(tokenDangDung, nguoiDungMoi);
  }

  // Hàm này xử lý khi người dùng gửi biểu mẫu hồ sơ.
  async function xuLyGuiHoSo(suKienGui) {
    suKienGui.preventDefault();
    capNhatLoiHoSo("");
    capNhatThongBaoHoSo("");

    // Biến này lưu họ đã được làm sạch.
    const hoDaCat = hoDangNhap.trim();

    // Biến này lưu tên đã được làm sạch.
    const tenDaCat = tenDangNhap.trim();

    // Biến này lưu số điện thoại đã được làm sạch.
    const soDienThoaiDaCat = soDienThoaiDangNhap.trim();

    if (hoDaCat === "") {
      capNhatLoiHoSo("Vui lòng nhập họ.");
      return;
    }

    if (tenDaCat === "") {
      capNhatLoiHoSo("Vui lòng nhập tên.");
      return;
    }

    if (soDienThoaiDaCat !== "") {
      const mauSoDienThoai = /^[0-9]{9,11}$/;

      if (mauSoDienThoai.test(soDienThoaiDaCat) === false) {
        capNhatLoiHoSo("Số điện thoại phải gồm 9 đến 11 chữ số.");
        return;
      }
    }

    // Biến này lưu ngày sinh đã được làm sạch.
    const ngaySinhDaCat = ngaySinhDangNhap.trim();

    if (ngaySinhDaCat !== "") {
      const ngaySinhDaChon = new Date(ngaySinhDaCat);

      if (Number.isNaN(ngaySinhDaChon.getTime()) === true) {
        capNhatLoiHoSo("Ngày sinh không hợp lệ.");
        return;
      }

      if (ngaySinhDaChon.getTime() >= Date.now()) {
        capNhatLoiHoSo("Ngày sinh phải là ngày trong quá khứ.");
        return;
      }
    }

    // Biến này lưu số điện thoại gửi lên backend.
    let soDienThoaiGuiLen = null;

    if (soDienThoaiDaCat !== "") {
      soDienThoaiGuiLen = soDienThoaiDaCat;
    }

    // Biến này lưu ngày sinh gửi lên backend.
    let ngaySinhGuiLen = null;

    if (ngaySinhDaCat !== "") {
      ngaySinhGuiLen = ngaySinhDaCat;
    }

    // Đối tượng này là dữ liệu hồ sơ gửi lên backend.
    const duLieuHoSo = {
      firstName: hoDaCat,
      lastName: tenDaCat,
      phone: soDienThoaiGuiLen,
      dateOfBirth: ngaySinhGuiLen,
    };

    capNhatDangLuuHoSo(true);

    try {
      // Biến này lưu hồ sơ sau khi backend cập nhật thành công.
      const hoSoSauCapNhat = await capNhatThongTinCaNhan(duLieuHoSo);

      boQuanLyTruyVan.setQueryData(["profile"], hoSoSauCapNhat);
      capNhatNguoiDungTrongTrinhDuyet(hoSoSauCapNhat);
      capNhatThongBaoHoSo("Đã lưu thay đổi.");
      capNhatDangLuuHoSo(false);
    } catch (loi) {
      const thongDiepLoi = layThongDiepLoiBackend(
        loi,
        "Không lưu được thông tin cá nhân. Vui lòng thử lại.",
      );

      capNhatLoiHoSo(thongDiepLoi);
      capNhatDangLuuHoSo(false);
    }
  }

  // Hàm này mở biểu mẫu để thêm một địa chỉ mới.
  function xuLyMoFormThemDiaChi() {
    capNhatMaDiaChiDangSua(0);
    capNhatTenNguoiNhan("");
    capNhatSoDienThoaiNhan("");
    capNhatDiaChiDayDu("");
    capNhatTinhThanhNhan("");
    capNhatLoiDiaChi("");
    capNhatThongBaoDiaChi("");
    capNhatMoFormDiaChi(true);
  }

  // Hàm này mở biểu mẫu để sửa một địa chỉ đã lưu.
  function xuLyMoFormSuaDiaChi(diaChi) {
    capNhatMaDiaChiDangSua(diaChi.id);
    capNhatTenNguoiNhan(diaChi.recipientName);
    capNhatSoDienThoaiNhan(diaChi.phone);
    capNhatDiaChiDayDu(diaChi.fullAddress);

    // Chỉ gán tỉnh/thành khi backend trả về chuỗi hợp lệ.
    if (typeof diaChi.province === "string") {
      capNhatTinhThanhNhan(diaChi.province);
    } else {
      capNhatTinhThanhNhan("");
    }

    capNhatLoiDiaChi("");
    capNhatThongBaoDiaChi("");
    capNhatMoFormDiaChi(true);
  }

  // Hàm này đóng biểu mẫu địa chỉ mà không lưu.
  function xuLyDongFormDiaChi() {
    capNhatMoFormDiaChi(false);
    capNhatLoiDiaChi("");
  }

  // Hàm này xử lý khi người dùng gửi biểu mẫu địa chỉ.
  async function xuLyGuiDiaChi(suKienGui) {
    suKienGui.preventDefault();
    capNhatLoiDiaChi("");
    capNhatThongBaoDiaChi("");

    // Biến này lưu tên người nhận đã được làm sạch.
    const tenNguoiNhanDaCat = tenNguoiNhan.trim();

    // Biến này lưu số điện thoại nhận hàng đã được làm sạch.
    const soDienThoaiNhanDaCat = soDienThoaiNhan.trim();

    // Biến này lưu địa chỉ đầy đủ đã được làm sạch.
    const diaChiDayDuDaCat = diaChiDayDu.trim();

    if (tenNguoiNhanDaCat === "") {
      capNhatLoiDiaChi("Vui lòng nhập tên người nhận.");
      return;
    }

    if (soDienThoaiNhanDaCat === "") {
      capNhatLoiDiaChi("Vui lòng nhập số điện thoại nhận hàng.");
      return;
    }

    const mauSoDienThoai = /^[0-9]{9,11}$/;

    if (mauSoDienThoai.test(soDienThoaiNhanDaCat) === false) {
      capNhatLoiDiaChi("Số điện thoại phải gồm 9 đến 11 chữ số.");
      return;
    }

    if (diaChiDayDuDaCat === "") {
      capNhatLoiDiaChi("Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }

    if (laTinhThanhHoTro(tinhThanhNhan) === false) {
      capNhatLoiDiaChi("Vui lòng chọn tỉnh/thành phố được hỗ trợ giao hàng.");
      return;
    }

    // Đối tượng này là dữ liệu địa chỉ gửi lên backend.
    const duLieuDiaChi = {
      recipientName: tenNguoiNhanDaCat,
      phone: soDienThoaiNhanDaCat,
      fullAddress: diaChiDayDuDaCat,
      province: tinhThanhNhan,
    };

    capNhatDangLuuDiaChi(true);

    try {
      if (maDiaChiDangSua > 0) {
        await capNhatDiaChi(maDiaChiDangSua, duLieuDiaChi);
      } else {
        await taoDiaChiMoi(duLieuDiaChi);
      }

      await boQuanLyTruyVan.invalidateQueries({ queryKey: ["addresses"] });
      capNhatThongBaoDiaChi("Đã lưu địa chỉ giao hàng.");
      capNhatMoFormDiaChi(false);
      capNhatDangLuuDiaChi(false);
    } catch (loi) {
      const thongDiepLoi = layThongDiepLoiBackend(
        loi,
        "Không lưu được địa chỉ. Vui lòng thử lại.",
      );

      capNhatLoiDiaChi(thongDiepLoi);
      capNhatDangLuuDiaChi(false);
    }
  }

  // Hàm này xoá một địa chỉ đã lưu sau khi người dùng xác nhận.
  async function xuLyXoaDiaChi(diaChi) {
    // Biến này cho biết người dùng đã đồng ý xoá địa chỉ hay chưa.
    const daDongY = window.confirm(
      "Bạn có chắc muốn xoá địa chỉ của " + diaChi.recipientName + "?",
    );

    if (daDongY === false) {
      return;
    }

    capNhatThongBaoDiaChi("");
    capNhatMaDiaChiDangXuLy(diaChi.id);

    try {
      await xoaDiaChi(diaChi.id);
      await boQuanLyTruyVan.invalidateQueries({ queryKey: ["addresses"] });
      capNhatThongBaoDiaChi("Đã xoá địa chỉ giao hàng.");
      capNhatMaDiaChiDangXuLy(0);
    } catch (loi) {
      const thongDiepLoi = layThongDiepLoiBackend(
        loi,
        "Không xoá được địa chỉ. Vui lòng thử lại.",
      );

      capNhatLoiDiaChi(thongDiepLoi);
      capNhatMaDiaChiDangXuLy(0);
    }
  }

  // Hàm này đặt một địa chỉ đã lưu làm địa chỉ mặc định.
  async function xuLyDatDiaChiMacDinh(diaChi) {
    capNhatThongBaoDiaChi("");
    capNhatLoiDiaChi("");
    capNhatMaDiaChiDangXuLy(diaChi.id);

    try {
      await datDiaChiMacDinh(diaChi.id);
      await boQuanLyTruyVan.invalidateQueries({ queryKey: ["addresses"] });
      capNhatThongBaoDiaChi("Đã đặt địa chỉ mặc định.");
      capNhatMaDiaChiDangXuLy(0);
    } catch (loi) {
      const thongDiepLoi = layThongDiepLoiBackend(
        loi,
        "Không đặt được địa chỉ mặc định. Vui lòng thử lại.",
      );

      capNhatLoiDiaChi(thongDiepLoi);
      capNhatMaDiaChiDangXuLy(0);
    }
  }

  // Hàm này tải lại danh sách địa chỉ khi người dùng bấm thử lại.
  function xuLyThuLaiDiaChi() {
    ketQuaDiaChi.refetch();
  }

  // Hàm này tải lại hồ sơ khi người dùng bấm thử lại.
  function xuLyThuLaiHoSo() {
    ketQuaHoSo.refetch();
  }

  // Mảng này lưu danh sách địa chỉ sau khi kiểm tra dữ liệu trả về.
  let danhSachDiaChi = [];

  const duLieuDiaChiTuBackend = ketQuaDiaChi.data;

  if (duLieuDiaChiTuBackend !== undefined) {
    if (duLieuDiaChiTuBackend !== null) {
      if (Array.isArray(duLieuDiaChiTuBackend) === true) {
        danhSachDiaChi = duLieuDiaChiTuBackend;
      }
    }
  }

  // Mảng này lưu các thẻ địa chỉ đã lưu.
  const cacTheDiaChi = [];

  // Mảng này lưu các nhóm tỉnh/thành để hiển thị trong biểu mẫu địa chỉ.
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

  // Tạo từng thẻ địa chỉ từ dữ liệu thật của backend.
  for (const diaChi of danhSachDiaChi) {
    // Phần tử này hiển thị huy hiệu mặc định khi địa chỉ đang xét là mặc định.
    let huyHieuMacDinh = null;

    if (diaChi.defaultAddress === true) {
      huyHieuMacDinh = (
        <span className="status status--completed">Mặc định</span>
      );
    }

    // Phần tử này hiển thị nút đặt mặc định cho địa chỉ chưa phải mặc định.
    let nutDatMacDinh = null;

    if (diaChi.defaultAddress !== true) {
      nutDatMacDinh = (
        <button
          className="link link--plain"
          type="button"
          onClick={function () {
            xuLyDatDiaChiMacDinh(diaChi);
          }}
          disabled={maDiaChiDangXuLy === diaChi.id}
        >
          <Check className="icon icon--sm" /> Đặt mặc định
        </button>
      );
    }

    cacTheDiaChi.push(
      <div className="address-card" key={diaChi.id}>
        <div className="address-card__body">
          <span className="address-card__name">
            {diaChi.recipientName}
            {huyHieuMacDinh}
          </span>
          <span className="address-card__meta">{diaChi.phone}</span>
          <span className="address-card__meta">{diaChi.fullAddress}</span>
          <span className="address-card__meta">{diaChi.province}</span>
        </div>
        <div className="address-card__actions">
          <button
            className="link link--plain"
            type="button"
            onClick={function () {
              xuLyMoFormSuaDiaChi(diaChi);
            }}
            disabled={maDiaChiDangXuLy === diaChi.id}
          >
            <Pencil className="icon icon--sm" /> Sửa
          </button>
          <button
            className="link link--plain"
            type="button"
            onClick={function () {
              xuLyXoaDiaChi(diaChi);
            }}
            disabled={maDiaChiDangXuLy === diaChi.id}
          >
            <Trash2 className="icon icon--sm" /> Xoá
          </button>
          {nutDatMacDinh}
        </div>
      </div>,
    );
  }

  // Phần tử này hiển thị danh sách địa chỉ hoặc thông báo rỗng.
  let phanTuDanhSachDiaChi = (
    <p className="muted account-empty">Bạn chưa lưu địa chỉ giao hàng nào.</p>
  );

  if (ketQuaDiaChi.isLoading === true) {
    phanTuDanhSachDiaChi = (
      <p className="muted account-empty" role="status">
        Đang tải địa chỉ giao hàng…
      </p>
    );
  } else if (ketQuaDiaChi.isError === true) {
    const thongDiepLoiDiaChi = layThongDiepLoiBackend(
      ketQuaDiaChi.error,
      "Không tải được danh sách địa chỉ. Vui lòng thử lại.",
    );

    phanTuDanhSachDiaChi = (
      <div className="alert alert--danger" role="alert">
        <CircleAlert className="icon icon--sm" />
        <div>
          <div>{thongDiepLoiDiaChi}</div>
          <button
            className="link link--plain"
            type="button"
            onClick={xuLyThuLaiDiaChi}
          >
            <RefreshCw className="icon icon--sm" /> Thử lại
          </button>
        </div>
      </div>
    );
  } else if (cacTheDiaChi.length > 0) {
    phanTuDanhSachDiaChi = (
      <div className="address-list">{cacTheDiaChi}</div>
    );
  }

  // Phần tử này hiển thị lỗi thao tác địa chỉ nếu có.
  let phanTuLoiDiaChi = null;

  if (loiDiaChi !== "") {
    phanTuLoiDiaChi = (
      <div className="alert alert--danger" role="alert">
        <CircleAlert className="icon icon--sm" />
        <div>{loiDiaChi}</div>
      </div>
    );
  }

  // Phần tử này hiển thị thông báo thao tác địa chỉ thành công nếu có.
  let phanTuThongBaoDiaChi = null;

  if (thongBaoDiaChi !== "") {
    phanTuThongBaoDiaChi = (
      <div className="alert alert--success" role="status">
        <Check className="icon icon--sm" />
        <div>{thongBaoDiaChi}</div>
      </div>
    );
  }

  // Tiêu đề biểu mẫu địa chỉ phụ thuộc vào việc đang thêm mới hay đang sửa.
  let tieuDeBieuMauDiaChi = "Thêm địa chỉ giao hàng";

  if (maDiaChiDangSua > 0) {
    tieuDeBieuMauDiaChi = "Sửa địa chỉ giao hàng";
  }

  // Biến này lưu nhãn nút lưu địa chỉ theo trạng thái xử lý.
  let nhanNutLuuDiaChi = "Lưu địa chỉ";

  if (dangLuuDiaChi === true) {
    nhanNutLuuDiaChi = "Đang lưu…";
  }

  // Phần tử này hiển thị biểu mẫu thêm hoặc sửa địa chỉ khi đang mở.
  let phanTuFormDiaChi = null;

  if (dangMoFormDiaChi === true) {
    phanTuFormDiaChi = (
      <form className="account-form address-form" onSubmit={xuLyGuiDiaChi}>
        <h3>{tieuDeBieuMauDiaChi}</h3>
        <div className="form-grid">
          <div className="field">
            <label className="required" htmlFor="diaChiTenNguoiNhan">
              Tên người nhận
            </label>
            <input
              className="input"
              id="diaChiTenNguoiNhan"
              value={tenNguoiNhan}
              onChange={function (suKienNhap) {
                capNhatTenNguoiNhan(suKienNhap.currentTarget.value);
              }}
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label className="required" htmlFor="diaChiSoDienThoai">
              Số điện thoại
            </label>
            <input
              className="input"
              id="diaChiSoDienThoai"
              value={soDienThoaiNhan}
              onChange={function (suKienNhap) {
                capNhatSoDienThoaiNhan(suKienNhap.currentTarget.value);
              }}
              inputMode="numeric"
              autoComplete="tel"
            />
          </div>
          <div className="field span-2">
            <label className="required" htmlFor="diaChiDayDu">
              Địa chỉ đầy đủ
            </label>
            <textarea
              className="textarea"
              id="diaChiDayDu"
              value={diaChiDayDu}
              onChange={function (suKienNhap) {
                capNhatDiaChiDayDu(suKienNhap.currentTarget.value);
              }}
              autoComplete="street-address"
            />
          </div>
          <div className="field span-2">
            <label className="required" htmlFor="diaChiTinhThanh">
              Tỉnh/thành phố
            </label>
            <select
              className="select"
              id="diaChiTinhThanh"
              value={tinhThanhNhan}
              onChange={function (suKienChon) {
                capNhatTinhThanhNhan(suKienChon.currentTarget.value);
              }}
            >
              <option value="">Chọn tỉnh/thành phố</option>
              {cacNhomTinhThanh}
            </select>
            <span className="field-hint">
              Tỉnh/thành phố quyết định phí giao hàng của đơn.
            </span>
          </div>
        </div>
        <div className="btn-row">
          <button
            className="btn btn--primary"
            type="submit"
            disabled={dangLuuDiaChi}
          >
            {nhanNutLuuDiaChi}
          </button>
          <button
            className="btn"
            type="button"
            onClick={xuLyDongFormDiaChi}
            disabled={dangLuuDiaChi}
          >
            Huỷ
          </button>
        </div>
      </form>
    );
  }

  // Phần tử này hiển thị thông báo lỗi hồ sơ nếu có.
  let phanTuLoiHoSo = null;

  if (loiHoSo !== "") {
    phanTuLoiHoSo = (
      <div className="alert alert--danger" role="alert">
        <CircleAlert className="icon icon--sm" />
        <div>{loiHoSo}</div>
      </div>
    );
  }

  // Phần tử này hiển thị thông báo lưu hồ sơ thành công nếu có.
  let phanTuThongBaoHoSo = null;

  if (thongBaoHoSo !== "") {
    phanTuThongBaoHoSo = (
      <div className="alert alert--success" role="status">
        <Check className="icon icon--sm" />
        <div>{thongBaoHoSo}</div>
      </div>
    );
  }

  // Biến này lưu nhãn nút lưu hồ sơ theo trạng thái xử lý.
  let nhanNutLuuHoSo = "Lưu thay đổi";

  if (dangLuuHoSo === true) {
    nhanNutLuuHoSo = "Đang lưu…";
  }

  // Phần tử này hiển thị nội dung tài khoản theo trạng thái của trang.
  let noiDungTaiKhoan;

  // Nếu chưa đăng nhập thì yêu cầu đăng nhập trước khi quản lý tài khoản.
  if (daDangNhap === false) {
    noiDungTaiKhoan = (
      <div className="catalog-state">
        <h2>Đăng nhập để quản lý tài khoản</h2>
        <p>Thông tin cá nhân và địa chỉ giao hàng gắn với tài khoản của bạn.</p>
        <Link className="btn btn--primary" to="/login?redirect=/account">
          Đăng nhập
        </Link>
      </div>
    );
  } else if (ketQuaHoSo.isLoading === true) {
    noiDungTaiKhoan = (
      <div className="catalog-state" role="status">
        <h2>Đang tải tài khoản…</h2>
        <p>MarketHub đang lấy thông tin cá nhân của bạn.</p>
      </div>
    );
  } else if (ketQuaHoSo.isError === true) {
    const laLoiHetPhien = kiemTraLaLoiHetPhien(ketQuaHoSo.error);

    const thongDiepLoi = layThongDiepLoiBackend(
      ketQuaHoSo.error,
      "Không tải được thông tin tài khoản. Vui lòng thử lại.",
    );

    let phanTuHanhDong = (
      <button
        className="btn btn--primary"
        type="button"
        onClick={xuLyThuLaiHoSo}
      >
        <RefreshCw className="icon icon--sm" /> Thử lại
      </button>
    );

    if (laLoiHetPhien === true) {
      phanTuHanhDong = (
        <Link className="btn btn--primary" to="/login?redirect=/account">
          Đăng nhập lại
        </Link>
      );
    }

    noiDungTaiKhoan = (
      <div className="catalog-state" role="alert">
        <CircleAlert className="icon icon--lg" />
        <h2>Không tải được tài khoản</h2>
        <p>{thongDiepLoi}</p>
        {phanTuHanhDong}
      </div>
    );
  } else {
    noiDungTaiKhoan = (
      <div className="account-layout">
        <nav className="account-nav" aria-label="Tài khoản">
          <a href="#thong-tin" aria-current="page">
            Thông tin cá nhân <ArrowRight className="icon icon--sm" />
          </a>
          <a href="#dia-chi">
            Địa chỉ giao hàng <ArrowRight className="icon icon--sm" />
          </a>
          <Link to="/orders">
            Đơn hàng <ArrowRight className="icon icon--sm" />
          </Link>
          <Link to="/" onClick={xuLyDangXuat}>
            Đăng xuất <LogOut className="icon icon--sm" />
          </Link>
        </nav>

        <div className="account-content">
          <section id="thong-tin">
            <h2>Thông tin cá nhân</h2>
            <form className="account-form" onSubmit={xuLyGuiHoSo}>
              {phanTuLoiHoSo}
              {phanTuThongBaoHoSo}

              <div className="form-grid">
                <div className="field">
                  <label className="required" htmlFor="hoNguoiDung">
                    Họ
                  </label>
                  <input
                    className="input"
                    id="hoNguoiDung"
                    value={hoDangNhap}
                    onChange={function (suKienNhap) {
                      capNhatHo(suKienNhap.currentTarget.value);
                    }}
                    autoComplete="family-name"
                  />
                </div>
                <div className="field">
                  <label className="required" htmlFor="tenNguoiDung">
                    Tên
                  </label>
                  <input
                    className="input"
                    id="tenNguoiDung"
                    value={tenDangNhap}
                    onChange={function (suKienNhap) {
                      capNhatTen(suKienNhap.currentTarget.value);
                    }}
                    autoComplete="given-name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="emailNguoiDung">Email</label>
                  <input
                    className="input"
                    id="emailNguoiDung"
                    value={emailHienTai}
                    type="email"
                    disabled
                  />
                  <span className="field-hint">Email không thể thay đổi.</span>
                </div>
                <div className="field">
                  <label htmlFor="soDienThoaiNguoiDung">Số điện thoại</label>
                  <input
                    className="input"
                    id="soDienThoaiNguoiDung"
                    value={soDienThoaiDangNhap}
                    onChange={function (suKienNhap) {
                      capNhatSoDienThoai(suKienNhap.currentTarget.value);
                    }}
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </div>
                <div className="field">
                  <label htmlFor="ngaySinhNguoiDung">Ngày sinh</label>
                  <input
                    className="input"
                    id="ngaySinhNguoiDung"
                    value={ngaySinhDangNhap}
                    onChange={function (suKienNhap) {
                      capNhatNgaySinh(suKienNhap.currentTarget.value);
                    }}
                    type="date"
                  />
                  <span className="field-hint">
                    Dùng để xác minh khi cần hỗ trợ đơn hàng.
                  </span>
                </div>
              </div>

              <div className="btn-row">
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={dangLuuHoSo}
                >
                  {nhanNutLuuHoSo}
                </button>
              </div>
            </form>
          </section>

          <section id="dia-chi">
            <h2>Địa chỉ giao hàng</h2>
            {phanTuLoiDiaChi}
            {phanTuThongBaoDiaChi}
            {phanTuDanhSachDiaChi}

            {phanTuFormDiaChi}

            <button
              className="btn btn--sm account-add-address"
              type="button"
              onClick={xuLyMoFormThemDiaChi}
              disabled={dangMoFormDiaChi}
            >
              <Plus className="icon icon--sm" /> Thêm địa chỉ
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Tài khoản</h1>
          <p>Quản lý thông tin cá nhân và địa chỉ giao hàng.</p>
        </div>
        <div className="page-head__aside">
          <Link className="link" to="/orders">
            Đơn hàng của tôi <ArrowRight className="icon icon--sm" />
          </Link>
        </div>
      </div>

      {noiDungTaiKhoan}
    </div>
  );
}
