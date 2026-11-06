import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  LoaderCircle,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  TriangleAlert,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import HopThoaiQuanTri from "../../components/admin/AdminModal";
import OChiSoQuanTri from "../../components/admin/AdminStatCard";
import { useAuth } from "../../hooks/useAuth.js";
import { useHoSoCaNhan } from "../../hooks/useProfile.js";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useCapNhatNguoiDungQuanTri,
  useCapNhatTrangThaiNguoiDungQuanTri,
  useChiTietNguoiDungQuanTri,
  useDanhSachNguoiDungQuanTri,
  useTaoNguoiDungQuanTri,
  useThongKeNguoiDungQuanTri,
  useXoaNguoiDungQuanTri,
} from "../../hooks/useAdmin";
import {
  dinhDangNgayDayDu,
  layChuVietTat,
  laySoLieuQuanTri,
  layTenHienThi,
  layThongBaoLoi,
} from "../../lib/adminHelpers";
import { taoDuongDanTaiNguyen } from "../../lib/assetUrl";
import { dinhDangTien } from "../../lib/formatMoney";

// Mảng này khai báo các tab vai trò người dùng.
const CAC_TAB_VAI_TRO = [
  { key: "ALL", label: "Tất cả" },
  { key: "USER", label: "Người dùng" },
  { key: "ADMIN", label: "Quản trị viên" },
];

// Thành phần này hiển thị ảnh đại diện hoặc chữ viết tắt của người dùng.
function AnhDaiDienNguoiDung(thuocTinh) {
  const nguoiDung = thuocTinh.user;
  const trangThaiLoiAnh = useState(false);
  const coLoiAnh = trangThaiLoiAnh[0];
  const capNhatCoLoiAnh = trangThaiLoiAnh[1];

  // Hàm này đánh dấu ảnh đại diện đã bị lỗi tải.
  function xuLyLoiAnh() {
    capNhatCoLoiAnh(true);
  }

  const duongDanAnh = taoDuongDanTaiNguyen(nguoiDung.avatar);

  if (duongDanAnh !== null) {
    if (coLoiAnh === false) {
      return (
        <img
          className="logo-thumb logo-thumb--round"
          src={duongDanAnh}
          alt=""
          onError={xuLyLoiAnh}
        />
      );
    }
  }

  return (
    <span className="logo-thumb logo-thumb--round">
      {layChuVietTat(nguoiDung)}
    </span>
  );
}

// Thành phần này hiển thị hộp thoại khoá hoặc mở khoá tài khoản.
function HopThoaiTrangThaiNguoiDung(thuocTinh) {
  const capNhatTrangThai = useCapNhatTrangThaiNguoiDungQuanTri();
  const nguoiDung = thuocTinh.user;

  // Biến này cho biết thao tác sắp tới là khoá tài khoản hay mở khoá.
  const dangKhoa = nguoiDung.status === 1;

  // Biến này lưu trạng thái mới sẽ gửi lên backend.
  let trangThaiMoi = 0;

  if (dangKhoa === false) {
    trangThaiMoi = 1;
  }

  // Biến này lưu tiêu đề hộp thoại.
  let tieuDe = "Mở khoá tài khoản";

  if (dangKhoa === true) {
    tieuDe = "Khoá tài khoản";
  }

  // Biến này lưu câu giải thích tác động của thao tác.
  let loiGiaiThich = "Người dùng sẽ có thể đăng nhập và tiếp tục mua sắm.";

  if (dangKhoa === true) {
    loiGiaiThich =
      "Người dùng sẽ không thể đăng nhập hoặc đặt hàng cho đến khi được mở khoá.";
  }

  // Biến này lưu nhãn của nút xác nhận.
  let nhanNut = "Mở khoá";

  if (dangKhoa === true) {
    nhanNut = "Khoá tài khoản";
  }

  // Hàm này gửi trạng thái mới lên backend.
  function xuLyDoiTrangThai() {
    capNhatTrangThai.mutate(
      { id: nguoiDung.id, status: trangThaiMoi },
      {
        onSuccess: thuocTinh.onClose,
      },
    );
  }

  // Phần tử này hiển thị biểu tượng phù hợp với thao tác.
  let phanTuBieuTuong = <LockOpen size={16} />;

  if (dangKhoa === true) {
    phanTuBieuTuong = <Lock size={16} />;
  }

  // Phần tử này hiển thị lỗi nếu thao tác thất bại.
  let phanTuLoi = null;

  if (capNhatTrangThai.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(capNhatTrangThai.error)}</div>
      </div>
    );
  }

  // Biến này lưu lớp CSS của nút xác nhận.
  let lopNutXacNhan = "btn btn--primary";

  if (dangKhoa === true) {
    lopNutXacNhan = "btn btn--danger";
  }

  // Phần tử này hiển thị biểu tượng trên nút xác nhận.
  let phanTuBieuTuongNut = phanTuBieuTuong;

  if (capNhatTrangThai.isPending === true) {
    phanTuBieuTuongNut = <LoaderCircle className="spin" size={16} />;
  }

  return (
    <HopThoaiQuanTri
      title={tieuDe}
      onClose={thuocTinh.onClose}
      width={480}
      footer={
        <>
          <button className="btn" type="button" onClick={thuocTinh.onClose}>
            Huỷ
          </button>
          <button
            className={lopNutXacNhan}
            type="button"
            disabled={capNhatTrangThai.isPending === true}
            onClick={xuLyDoiTrangThai}
          >
            {phanTuBieuTuongNut}
            {nhanNut}
          </button>
        </>
      }
    >
      <div className="cell-main admin-delete-target">
        <AnhDaiDienNguoiDung user={nguoiDung} />
        <div>
          <strong>{layTenHienThi(nguoiDung)}</strong>
          <div className="cell-sub">{nguoiDung.email}</div>
        </div>
      </div>
      <p>{loiGiaiThich}</p>
      {phanTuLoi}
    </HopThoaiQuanTri>
  );
}

// Thành phần này hiển thị biểu mẫu thêm mới hoặc chỉnh sửa người dùng.
function HopThoaiBieuMauNguoiDung(thuocTinh) {
  const dangTaoMoi = thuocTinh.mode === "create";
  const nguoiDung = thuocTinh.user;
  const taoNguoiDung = useTaoNguoiDungQuanTri();
  const capNhatNguoiDung = useCapNhatNguoiDungQuanTri();

  // Các biến này lưu giá trị ban đầu của biểu mẫu.
  let emailBanDau = "";
  let hoBanDau = "";
  let tenBanDau = "";
  let dienThoaiBanDau = "";
  let ngaySinhBanDau = "";
  let vaiTroBanDau = "USER";
  let trangThaiBanDau = "1";

  if (nguoiDung !== null) {
    if (nguoiDung !== undefined) {
      emailBanDau = nguoiDung.email;
      hoBanDau = nguoiDung.firstName;
      tenBanDau = nguoiDung.lastName;
      vaiTroBanDau = nguoiDung.role;
      trangThaiBanDau = String(nguoiDung.status);

      if (typeof nguoiDung.phone === "string") {
        dienThoaiBanDau = nguoiDung.phone;
      }

      if (typeof nguoiDung.dateOfBirth === "string") {
        ngaySinhBanDau = nguoiDung.dateOfBirth;
      }
    }
  }

  const trangThaiEmail = useState(emailBanDau);
  const email = trangThaiEmail[0];
  const capNhatEmail = trangThaiEmail[1];

  const trangThaiMatKhau = useState("");
  const matKhau = trangThaiMatKhau[0];
  const capNhatMatKhau = trangThaiMatKhau[1];

  const trangThaiHo = useState(hoBanDau);
  const ho = trangThaiHo[0];
  const capNhatHo = trangThaiHo[1];

  const trangThaiTen = useState(tenBanDau);
  const ten = trangThaiTen[0];
  const capNhatTen = trangThaiTen[1];

  const trangThaiDienThoai = useState(dienThoaiBanDau);
  const dienThoai = trangThaiDienThoai[0];
  const capNhatDienThoai = trangThaiDienThoai[1];

  const trangThaiNgaySinh = useState(ngaySinhBanDau);
  const ngaySinh = trangThaiNgaySinh[0];
  const capNhatNgaySinh = trangThaiNgaySinh[1];

  const trangThaiVaiTro = useState(vaiTroBanDau);
  const vaiTro = trangThaiVaiTro[0];
  const capNhatVaiTro = trangThaiVaiTro[1];

  const trangThaiTrangThai = useState(trangThaiBanDau);
  const trangThaiTaiKhoan = trangThaiTrangThai[0];
  const capNhatTrangThaiTaiKhoan = trangThaiTrangThai[1];

  const trangThaiLoiBieuMau = useState("");
  const loiBieuMau = trangThaiLoiBieuMau[0];
  const capNhatLoiBieuMau = trangThaiLoiBieuMau[1];

  // Biến này cho biết biểu mẫu đang gửi dữ liệu hay không.
  let dangGui = capNhatNguoiDung.isPending;

  if (dangTaoMoi === true) {
    dangGui = taoNguoiDung.isPending;
  }

  // Hàm này kiểm tra dữ liệu và gửi lên backend.
  function xuLyGuiBieuMau(suKienGui) {
    suKienGui.preventDefault();
    capNhatLoiBieuMau("");

    if (email.trim() === "") {
      capNhatLoiBieuMau("Vui lòng nhập email.");
      return;
    }

    if (ho.trim() === "") {
      capNhatLoiBieuMau("Vui lòng nhập họ.");
      return;
    }

    if (ten.trim() === "") {
      capNhatLoiBieuMau("Vui lòng nhập tên.");
      return;
    }

    if (dangTaoMoi === true) {
      if (matKhau.length < 6) {
        capNhatLoiBieuMau("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
    }

    if (matKhau !== "") {
      if (matKhau.length < 6) {
        capNhatLoiBieuMau("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
    }

    // Biến này lưu dữ liệu gửi lên backend.
    const duLieuGui = {
      email: email.trim(),
      password: matKhau,
      firstName: ho.trim(),
      lastName: ten.trim(),
      phone: dienThoai.trim(),
      dateOfBirth: ngaySinh,
      role: vaiTro,
      status: Number(trangThaiTaiKhoan),
    };

    if (ngaySinh === "") {
      duLieuGui.dateOfBirth = null;
    }

    if (dangTaoMoi === true) {
      taoNguoiDung.mutate(duLieuGui, {
        onSuccess: thuocTinh.onClose,
      });
      return;
    }

    capNhatNguoiDung.mutate(
      { id: nguoiDung.id, duLieu: duLieuGui },
      {
        onSuccess: thuocTinh.onClose,
      },
    );
  }

  // Phần tử này hiển thị lỗi do backend trả về.
  let phanTuLoiThaoTac = null;

  if (dangTaoMoi === true) {
    if (taoNguoiDung.isError === true) {
      phanTuLoiThaoTac = (
        <div className="alert alert--danger" role="alert">
          <TriangleAlert size={18} />
          <div>{layThongBaoLoi(taoNguoiDung.error)}</div>
        </div>
      );
    }
  }

  if (dangTaoMoi === false) {
    if (capNhatNguoiDung.isError === true) {
      phanTuLoiThaoTac = (
        <div className="alert alert--danger" role="alert">
          <TriangleAlert size={18} />
          <div>{layThongBaoLoi(capNhatNguoiDung.error)}</div>
        </div>
      );
    }
  }

  // Biến này lưu tiêu đề hộp thoại.
  let tieuDe = "Chỉnh sửa tài khoản";

  if (dangTaoMoi === true) {
    tieuDe = "Thêm tài khoản";
  }

  // Biến này lưu nhãn nút gửi.
  let nhanNutGui = "Lưu thay đổi";

  if (dangTaoMoi === true) {
    nhanNutGui = "Tạo tài khoản";
  }

  // Phần tử này hiển thị biểu tượng trên nút gửi.
  let bieuTuongNutGui = <Pencil size={16} />;

  if (dangTaoMoi === true) {
    bieuTuongNutGui = <Plus size={16} />;
  }

  if (dangGui === true) {
    bieuTuongNutGui = <LoaderCircle className="spin" size={16} />;
  }

  // Phần tử này hiển thị gợi ý mật khẩu theo từng chế độ.
  let goiYMatKhau = "Để trống nếu không muốn đổi mật khẩu.";

  if (dangTaoMoi === true) {
    goiYMatKhau = "Mật khẩu tối thiểu 6 ký tự.";
  }

  // Biến này lưu nhãn của trường mật khẩu theo từng chế độ.
  let nhanMatKhau = "Mật khẩu mới";

  if (dangTaoMoi === true) {
    nhanMatKhau = "Mật khẩu";
  }

  // Phần tử này hiển thị lỗi kiểm tra dữ liệu phía trình duyệt.
  let phanTuLoiBieuMau = null;

  if (loiBieuMau !== "") {
    phanTuLoiBieuMau = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{loiBieuMau}</div>
      </div>
    );
  }

  return (
    <HopThoaiQuanTri
      title={tieuDe}
      onClose={thuocTinh.onClose}
      width={620}
      footer={
        <>
          <button className="btn" type="button" onClick={thuocTinh.onClose}>
            Huỷ
          </button>
          <button
            className="btn btn--primary"
            type="submit"
            form="bieu-mau-nguoi-dung"
            disabled={dangGui === true}
          >
            {bieuTuongNutGui}
            {nhanNutGui}
          </button>
        </>
      }
    >
      <form
        className="admin-form"
        id="bieu-mau-nguoi-dung"
        onSubmit={xuLyGuiBieuMau}
      >
        {phanTuLoiThaoTac}

        <div className="form-grid">
          <div className="field span-2">
            <label className="required" htmlFor="nguoi-dung-email">
              Email
            </label>
            <input
              className="input"
              id="nguoi-dung-email"
              type="email"
              value={email}
              onChange={function (suKienNhap) {
                capNhatEmail(suKienNhap.target.value);
              }}
              placeholder="email@vidu.com"
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label className="required" htmlFor="nguoi-dung-ho">
              Họ
            </label>
            <input
              className="input"
              id="nguoi-dung-ho"
              value={ho}
              onChange={function (suKienNhap) {
                capNhatHo(suKienNhap.target.value);
              }}
            />
          </div>

          <div className="field">
            <label className="required" htmlFor="nguoi-dung-ten">
              Tên
            </label>
            <input
              className="input"
              id="nguoi-dung-ten"
              value={ten}
              onChange={function (suKienNhap) {
                capNhatTen(suKienNhap.target.value);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="nguoi-dung-dien-thoai">Số điện thoại</label>
            <input
              className="input"
              id="nguoi-dung-dien-thoai"
              value={dienThoai}
              onChange={function (suKienNhap) {
                capNhatDienThoai(suKienNhap.target.value);
              }}
              placeholder="0901234567"
            />
          </div>

          <div className="field">
            <label htmlFor="nguoi-dung-ngay-sinh">Ngày sinh</label>
            <input
              className="input"
              id="nguoi-dung-ngay-sinh"
              type="date"
              value={ngaySinh}
              onChange={function (suKienNhap) {
                capNhatNgaySinh(suKienNhap.target.value);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="nguoi-dung-vai-tro">Vai trò</label>
            <select
              className="select"
              id="nguoi-dung-vai-tro"
              value={vaiTro}
              onChange={function (suKienChon) {
                capNhatVaiTro(suKienChon.target.value);
              }}
            >
              <option value="USER">Người dùng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="nguoi-dung-trang-thai">Trạng thái</label>
            <select
              className="select"
              id="nguoi-dung-trang-thai"
              value={trangThaiTaiKhoan}
              onChange={function (suKienChon) {
                capNhatTrangThaiTaiKhoan(suKienChon.target.value);
              }}
            >
              <option value="1">Đang hoạt động</option>
              <option value="0">Đã khoá</option>
            </select>
          </div>

          <div className="field span-2">
            <label htmlFor="nguoi-dung-mat-khau">{nhanMatKhau}</label>
            <input
              className="input"
              id="nguoi-dung-mat-khau"
              type="password"
              value={matKhau}
              onChange={function (suKienNhap) {
                capNhatMatKhau(suKienNhap.target.value);
              }}
              autoComplete="new-password"
            />
            <span className="field-hint">{goiYMatKhau}</span>
          </div>
        </div>

        {phanTuLoiBieuMau}
      </form>
    </HopThoaiQuanTri>
  );
}

// Thành phần này hiển thị chi tiết một tài khoản người dùng.
function HopThoaiChiTietNguoiDung(thuocTinh) {
  const ketQuaChiTiet = useChiTietNguoiDungQuanTri(thuocTinh.userId);
  const duLieu = ketQuaChiTiet.data;

  // Phần tử này hiển thị trạng thái đang tải chi tiết.
  let phanTuDangTai = null;

  if (ketQuaChiTiet.isLoading === true) {
    phanTuDangTai = (
      <div className="admin-state">
        <LoaderCircle className="spin" size={24} />
        <span>Đang tải thông tin tài khoản…</span>
      </div>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được chi tiết.
  let phanTuLoi = null;

  if (ketQuaChiTiet.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(ketQuaChiTiet.error)}</div>
      </div>
    );
  }

  // Phần tử này hiển thị nội dung chi tiết khi đã có dữ liệu.
  let phanTuNoiDung = null;

  if (duLieu !== null) {
    if (duLieu !== undefined) {
      // Biến này lưu nhãn vai trò của tài khoản.
      let nhanVaiTro = "Người dùng";

      if (duLieu.role === "ADMIN") {
        nhanVaiTro = "Quản trị viên";
      }

      // Biến này lưu nhãn trạng thái của tài khoản.
      let nhanTrangThai = "Đã khoá";

      if (duLieu.status === 1) {
        nhanTrangThai = "Đang hoạt động";
      }

      // Phần tử này hiển thị trạng thái tài khoản.
      let phanTuTrangThaiTaiKhoan = (
        <span className="status status--cancelled">{nhanTrangThai}</span>
      );

      if (duLieu.status === 1) {
        phanTuTrangThaiTaiKhoan = (
          <span className="status status--completed">{nhanTrangThai}</span>
        );
      }

      // Biến này lưu số điện thoại an toàn để hiển thị.
      let giaTriDienThoai = "—";

      if (typeof duLieu.phone === "string") {
        if (duLieu.phone !== "") {
          giaTriDienThoai = duLieu.phone;
        }
      }

      // Phần tử này hiển thị thông tin tài khoản khi đã có dữ liệu.
      phanTuNoiDung = (
        <>
          <div className="cell-main admin-delete-target">
            <AnhDaiDienNguoiDung user={duLieu} />
            <div>
              <strong>{layTenHienThi(duLieu)}</strong>
              <div className="cell-sub">{duLieu.email}</div>
            </div>
          </div>

          <div className="admin-meta-row">
            <span className="status status--muted">{nhanVaiTro}</span>
            {phanTuTrangThaiTaiKhoan}
          </div>

          <dl className="info-list admin-field-gap">
            <div className="info-list__row">
              <dt>Mã tài khoản</dt>
              <dd>#{duLieu.id}</dd>
            </div>
            <div className="info-list__row">
              <dt>Điện thoại</dt>
              <dd>{giaTriDienThoai}</dd>
            </div>
            <div className="info-list__row">
              <dt>Ngày sinh</dt>
              <dd>{dinhDangNgayDayDu(duLieu.dateOfBirth)}</dd>
            </div>
          </dl>

          <div className="stat-grid admin-field-gap">
            <OChiSoQuanTri
              icon={ShoppingBag}
              tone="var(--blue)"
              value={laySoLieuQuanTri(duLieu.orderCount)}
              label="Tổng đơn hàng"
              meta="Mọi trạng thái"
            />
            <OChiSoQuanTri
              icon={ShieldCheck}
              tone="var(--green)"
              value={laySoLieuQuanTri(duLieu.completedOrderCount)}
              label="Đơn hoàn tất"
              meta="Đã giao thành công"
            />
            <OChiSoQuanTri
              icon={Trash2}
              tone="var(--red)"
              value={laySoLieuQuanTri(duLieu.cancelledOrderCount)}
              label="Đơn đã huỷ"
              meta="Không tính vào chi tiêu"
            />
            <OChiSoQuanTri
              icon={CalendarDays}
              tone="var(--green-dark)"
              value={dinhDangTien(duLieu.totalSpentMinor)}
              label="Đã chi tiêu"
              meta="Chỉ tính đơn hoàn tất"
            />
          </div>
        </>
      );
    }
  }

  return (
    <HopThoaiQuanTri
      title="Chi tiết tài khoản"
      onClose={thuocTinh.onClose}
      width={640}
      footer={
        <button className="btn" type="button" onClick={thuocTinh.onClose}>
          Đóng
        </button>
      }
    >
      {phanTuDangTai}
      {phanTuLoi}
      {phanTuNoiDung}
    </HopThoaiQuanTri>
  );
}

// Thành phần này xác nhận xoá mềm một tài khoản người dùng.
function HopThoaiXoaNguoiDung(thuocTinh) {
  const xoaNguoiDung = useXoaNguoiDungQuanTri();
  const nguoiDung = thuocTinh.user;

  // Hàm này gửi yêu cầu xoá tài khoản lên backend.
  function xuLyXoa() {
    xoaNguoiDung.mutate(nguoiDung.id, {
      onSuccess: thuocTinh.onClose,
    });
  }

  // Phần tử này hiển thị lỗi nếu xoá thất bại.
  let phanTuLoi = null;

  if (xoaNguoiDung.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(xoaNguoiDung.error)}</div>
      </div>
    );
  }

  // Phần tử này hiển thị biểu tượng trên nút xoá.
  let bieuTuongNutXoa = <Trash2 size={16} />;

  if (xoaNguoiDung.isPending === true) {
    bieuTuongNutXoa = <LoaderCircle className="spin" size={16} />;
  }

  return (
    <HopThoaiQuanTri
      title="Xoá tài khoản"
      onClose={thuocTinh.onClose}
      width={480}
      footer={
        <>
          <button className="btn" type="button" onClick={thuocTinh.onClose}>
            Huỷ
          </button>
          <button
            className="btn btn--danger"
            type="button"
            disabled={xoaNguoiDung.isPending === true}
            onClick={xuLyXoa}
          >
            {bieuTuongNutXoa}
            Xoá tài khoản
          </button>
        </>
      }
    >
      <div className="cell-main admin-delete-target">
        <AnhDaiDienNguoiDung user={nguoiDung} />
        <div>
          <strong>{layTenHienThi(nguoiDung)}</strong>
          <div className="cell-sub">{nguoiDung.email}</div>
        </div>
      </div>
      <p>
        Tài khoản sẽ bị ẩn khỏi danh sách và không thể đăng nhập. Dữ liệu đơn
        hàng cũ vẫn được giữ lại.
      </p>
      {phanTuLoi}
    </HopThoaiQuanTri>
  );
}


export default function TrangNguoiDungQuanTri() {
  const trangThaiVaiTro = useState("ALL");
  const vaiTroDangChon = trangThaiVaiTro[0];
  const capNhatVaiTro = trangThaiVaiTro[1];

  const trangThaiLocTrangThai = useState("ALL");
  const trangThaiDangLoc = trangThaiLocTrangThai[0];
  const capNhatTrangThaiDangLoc = trangThaiLocTrangThai[1];

  const trangThaiTuKhoa = useState("");
  const tuKhoa = trangThaiTuKhoa[0];
  const capNhatTuKhoa = trangThaiTuKhoa[1];

  const trangThaiSoTrang = useState(1);
  const soTrang = trangThaiSoTrang[0];
  const capNhatSoTrang = trangThaiSoTrang[1];

  const trangThaiNguoiDungChon = useState(null);
  const nguoiDungDuocChon = trangThaiNguoiDungChon[0];
  const capNhatNguoiDungDuocChon = trangThaiNguoiDungChon[1];

  const trangThaiBieuMau = useState(null);
  const bieuMauDangMo = trangThaiBieuMau[0];
  const capNhatBieuMau = trangThaiBieuMau[1];

  const trangThaiChiTiet = useState(null);
  const maNguoiDungXem = trangThaiChiTiet[0];
  const capNhatMaNguoiDungXem = trangThaiChiTiet[1];

  const trangThaiXoa = useState(null);
  const nguoiDungDangXoa = trangThaiXoa[0];
  const capNhatNguoiDungDangXoa = trangThaiXoa[1];

  const tuKhoaTre = useDebounce(tuKhoa.trim(), 400);

  const trangThaiDangNhap = useAuth();
  const ketQuaHoSo = useHoSoCaNhan(trangThaiDangNhap.daDangNhap);

  // Biến này lưu hồ sơ của quản trị viên đang đăng nhập.
  const hoSoQuanTri = ketQuaHoSo.data;

  // Bộ lọc này được gửi lên backend mỗi khi bộ lọc hoặc trang đổi.
  const thamSoTruyVan = {
    page: soTrang,
    size: 10,
  };

  if (vaiTroDangChon !== "ALL") {
    thamSoTruyVan.role = vaiTroDangChon;
  }

  if (trangThaiDangLoc !== "ALL") {
    thamSoTruyVan.status = Number(trangThaiDangLoc);
  }

  if (tuKhoaTre !== "") {
    thamSoTruyVan.q = tuKhoaTre;
  }

  const ketQuaNguoiDung = useDanhSachNguoiDungQuanTri(thamSoTruyVan);
  const ketQuaThongKe = useThongKeNguoiDungQuanTri();

  // Biến này lưu số liệu thống kê sau khi kiểm tra dữ liệu.
  let duLieuThongKe = {};

  if (ketQuaThongKe.data !== null) {
    if (ketQuaThongKe.data !== undefined) {
      duLieuThongKe = ketQuaThongKe.data;
    }
  }

  // Biến này lưu danh sách người dùng sau khi kiểm tra dữ liệu.
  let danhSachNguoiDung = [];

  if (ketQuaNguoiDung.data !== null) {
    if (ketQuaNguoiDung.data !== undefined) {
      if (Array.isArray(ketQuaNguoiDung.data.items) === true) {
        danhSachNguoiDung = ketQuaNguoiDung.data.items;
      }
    }
  }

  // Các biến này lưu thông tin phân trang do backend trả về.
  let trangHienTai = 1;
  let tongSoTrang = 1;
  let tongSoNguoiDung = 0;

  if (ketQuaNguoiDung.data !== null) {
    if (ketQuaNguoiDung.data !== undefined) {
      const soTrangTuBackend = Number(ketQuaNguoiDung.data.totalPages);
      const soNguoiDungTuBackend = Number(ketQuaNguoiDung.data.totalItems);
      const trangTuBackend = Number(ketQuaNguoiDung.data.page);

      if (Number.isFinite(trangTuBackend) === true) {
        if (trangTuBackend > 0) {
          trangHienTai = trangTuBackend;
        }
      }

      if (Number.isFinite(soTrangTuBackend) === true) {
        if (soTrangTuBackend > 0) {
          tongSoTrang = soTrangTuBackend;
        }
      }

      if (Number.isFinite(soNguoiDungTuBackend) === true) {
        tongSoNguoiDung = soNguoiDungTuBackend;
      }
    }
  }

  // Hàm này đổi vai trò đang lọc và quay về trang đầu.
  function xuLyChonVaiTro(suKienBam) {
    capNhatVaiTro(suKienBam.currentTarget.value);
    capNhatSoTrang(1);
  }

  // Hàm này đổi bộ lọc trạng thái và quay về trang đầu.
  function xuLyThayDoiTrangThaiLoc(suKienThayDoi) {
    capNhatTrangThaiDangLoc(suKienThayDoi.target.value);
    capNhatSoTrang(1);
  }

  // Hàm này cập nhật từ khoá tìm kiếm và quay về trang đầu.
  function xuLyThayDoiTuKhoa(suKienNhap) {
    capNhatTuKhoa(suKienNhap.target.value);
    capNhatSoTrang(1);
  }

  // Hàm này đưa danh sách về trang trước.
  function xuLyVeTrangTruoc() {
    if (soTrang > 1) {
      capNhatSoTrang(soTrang - 1);
    }
  }

  // Hàm này đưa danh sách sang trang sau.
  function xuLySangTrangSau() {
    if (soTrang < tongSoTrang) {
      capNhatSoTrang(soTrang + 1);
    }
  }

  // Mảng này lưu giao diện các tab vai trò.
  const cacTabVaiTro = [];

  for (const tabVaiTro of CAC_TAB_VAI_TRO) {
    // Biến này cho biết tab hiện tại có đang được chọn hay không.
    let dangDuocChon = false;

    if (vaiTroDangChon === tabVaiTro.key) {
      dangDuocChon = true;
    }

    // Biến này lưu giá trị aria-current của tab.
    let giaTriAriaCurrent = "false";

    if (dangDuocChon === true) {
      giaTriAriaCurrent = "page";
    }

    cacTabVaiTro.push(
      <button
        className="filter-tab"
        type="button"
        key={tabVaiTro.key}
        value={tabVaiTro.key}
        aria-current={giaTriAriaCurrent}
        onClick={xuLyChonVaiTro}
      >
        {tabVaiTro.label}
      </button>,
    );
  }

  // Mảng này lưu giao diện từng dòng người dùng.
  const cacDongNguoiDung = [];

  for (const nguoiDung of danhSachNguoiDung) {
    // Biến này cho biết người dùng hiện tại có vai trò quản trị hay không.
    const laQuanTri = nguoiDung.role === "ADMIN";

    // Biến này cho biết dòng hiện tại có phải tài khoản đang đăng nhập.
    let laChinhMinh = false;

    if (hoSoQuanTri !== null) {
      if (hoSoQuanTri !== undefined) {
        if (hoSoQuanTri.id === nguoiDung.id) {
          laChinhMinh = true;
        }
      }
    }

    // Hàm này mở hộp thoại khoá hoặc mở khoá người dùng hiện tại.
    const xuLyMoHopThoai = function () {
      capNhatNguoiDungDuocChon(nguoiDung);
    };

    // Hàm này mở hộp thoại xem chi tiết người dùng hiện tại.
    const xuLyXemChiTiet = function () {
      capNhatMaNguoiDungXem(nguoiDung.id);
    };

    // Hàm này mở biểu mẫu chỉnh sửa người dùng hiện tại.
    const xuLySuaNguoiDung = function () {
      capNhatBieuMau({ mode: "edit", user: nguoiDung });
    };

    // Hàm này mở hộp thoại xoá người dùng hiện tại.
    const xuLyXoaNguoiDung = function () {
      capNhatNguoiDungDangXoa(nguoiDung);
    };

    // Phần tử này hiển thị nhãn vai trò.
    let phanTuVaiTro = (
      <span className="status status--muted">Người dùng</span>
    );

    if (laQuanTri === true) {
      phanTuVaiTro = (
        <span className="status status--confirmed">
          <ShieldCheck size={12} /> Quản trị
        </span>
      );
    }

    // Phần tử này hiển thị trạng thái hoạt động của tài khoản.
    let phanTuTrangThai = (
      <span className="status status--cancelled">Đã khoá</span>
    );

    if (nguoiDung.status === 1) {
      phanTuTrangThai = (
        <span className="status status--completed">Đang hoạt động</span>
      );
    }

    // Phần tử này hiển thị nút khoá hoặc mở khoá nếu được phép.
    let phanTuKhoa = null;

    if (laQuanTri === false) {
      // Biến này lưu tiêu đề của nút khoá hoặc mở khoá.
      let tieuDeKhoa = "Mở khoá tài khoản";
      let bieuTuongKhoa = <LockOpen size={15} />;

      if (nguoiDung.status === 1) {
        tieuDeKhoa = "Khoá tài khoản";
        bieuTuongKhoa = <Lock size={15} />;
      }

      if (laChinhMinh === true) {
        tieuDeKhoa = "Không thể tự khoá tài khoản của mình";
      }

      phanTuKhoa = (
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          disabled={laChinhMinh === true}
          title={tieuDeKhoa}
          aria-label={tieuDeKhoa}
          onClick={xuLyMoHopThoai}
        >
          {bieuTuongKhoa}
        </button>
      );
    }

    // Biến này lưu tiêu đề giải thích khi không thể tự sửa.
    let tieuDeSua = "Chỉnh sửa tài khoản";

    if (laChinhMinh === true) {
      tieuDeSua = "Không thể tự sửa tài khoản của mình";
    }

    // Phần tử này hiển thị nút xoá nếu tài khoản không phải quản trị.
    let phanTuXoa = null;

    if (laQuanTri === false) {
      // Biến này lưu tiêu đề giải thích khi không thể tự xoá.
      let tieuDeXoa = "Xoá tài khoản";

      if (laChinhMinh === true) {
        tieuDeXoa = "Không thể tự xoá tài khoản của mình";
      }

      phanTuXoa = (
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          disabled={laChinhMinh === true}
          title={tieuDeXoa}
          aria-label={tieuDeXoa}
          onClick={xuLyXoaNguoiDung}
        >
          <Trash2 size={15} />
        </button>
      );
    }

    // Phần tử này nhóm các thao tác của dòng hiện tại.
    const phanTuThaoTac = (
      <>
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          title="Xem chi tiết"
          aria-label="Xem chi tiết"
          onClick={xuLyXemChiTiet}
        >
          <Eye size={15} />
        </button>
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          disabled={laChinhMinh === true}
          title={tieuDeSua}
          aria-label={tieuDeSua}
          onClick={xuLySuaNguoiDung}
        >
          <Pencil size={15} />
        </button>
        {phanTuKhoa}
        {phanTuXoa}
      </>
    );

    cacDongNguoiDung.push(
      <tr key={nguoiDung.id}>
        <td>
          <div className="cell-main">
            <AnhDaiDienNguoiDung user={nguoiDung} />
            <div>
              <strong>{layTenHienThi(nguoiDung)}</strong>
              <div className="cell-sub">{nguoiDung.email}</div>
            </div>
          </div>
        </td>
        <td>
          {nguoiDung.phone}
          <div className="cell-sub">#{nguoiDung.id}</div>
        </td>
        <td>{phanTuVaiTro}</td>
        <td>{phanTuTrangThai}</td>
        <td>
          <div className="table-actions">{phanTuThaoTac}</div>
        </td>
      </tr>,
    );
  }

  // Phần tử này hiển thị trạng thái đang tải người dùng.
  let phanTuDangTai = null;

  if (ketQuaNguoiDung.isLoading === true) {
    phanTuDangTai = (
      <div className="admin-state">
        <LoaderCircle className="spin" size={24} />
        <span>Đang tải người dùng…</span>
      </div>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được người dùng.
  let phanTuLoi = null;

  if (ketQuaNguoiDung.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>Không tải được danh sách người dùng.</div>
      </div>
    );
  }

  // Phần tử này hiển thị trạng thái không có người dùng phù hợp.
  let phanTuRong = null;

  if (ketQuaNguoiDung.isLoading === false) {
    if (ketQuaNguoiDung.isError === false) {
      if (cacDongNguoiDung.length === 0) {
        phanTuRong = (
          <div className="admin-state">
            <Inbox size={34} />
            <span>Không có người dùng phù hợp.</span>
          </div>
        );
      }
    }
  }

  // Phần tử này hiển thị nút chuyển trang trước.
  let phanTuTrangTruoc = (
    <button className="btn btn--ghost btn--sm" type="button" disabled>
      <ChevronLeft size={16} /> Trước
    </button>
  );

  if (trangHienTai > 1) {
    phanTuTrangTruoc = (
      <button
        className="btn btn--ghost btn--sm"
        type="button"
        onClick={xuLyVeTrangTruoc}
      >
        <ChevronLeft size={16} /> Trước
      </button>
    );
  }

  // Phần tử này hiển thị nút chuyển trang sau.
  let phanTuTrangSau = (
    <button className="btn btn--ghost btn--sm" type="button" disabled>
      Sau <ChevronRight size={16} />
    </button>
  );

  if (trangHienTai < tongSoTrang) {
    phanTuTrangSau = (
      <button
        className="btn btn--ghost btn--sm"
        type="button"
        onClick={xuLySangTrangSau}
      >
        Sau <ChevronRight size={16} />
      </button>
    );
  }

  // Phần tử này hiển thị biểu tượng khi danh sách đang làm mới.
  let phanTuDangCapNhat = null;

  if (ketQuaNguoiDung.isFetching === true) {
    phanTuDangCapNhat = <LoaderCircle className="spin muted" size={16} />;
  }

  // Phần tử này hiển thị bảng và thanh phân trang khi có người dùng.
  let phanTuBangNguoiDung = null;

  if (cacDongNguoiDung.length > 0) {
    phanTuBangNguoiDung = (
      <>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th className="num">Thao tác</th>
              </tr>
            </thead>
            <tbody>{cacDongNguoiDung}</tbody>
          </table>
        </div>

        <div className="pagination admin-pagination">
          {phanTuTrangTruoc}
          <span className="muted">
            Trang {trangHienTai} / {tongSoTrang} · {tongSoNguoiDung} người
            dùng
          </span>
          {phanTuTrangSau}
        </div>
      </>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được số liệu thống kê.
  let phanTuLoiThongKe = null;

  if (ketQuaThongKe.isError === true) {
    phanTuLoiThongKe = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>Không tải được số liệu thống kê người dùng.</div>
      </div>
    );
  }

  // Phần tử này hiển thị hộp thoại đổi trạng thái người dùng.
  let phanTuHopThoai = null;

  if (nguoiDungDuocChon !== null) {
    phanTuHopThoai = (
      <HopThoaiTrangThaiNguoiDung
        user={nguoiDungDuocChon}
        onClose={function () {
          capNhatNguoiDungDuocChon(null);
        }}
      />
    );
  }

  // Phần tử này hiển thị biểu mẫu thêm mới hoặc chỉnh sửa người dùng.
  let phanTuBieuMau = null;

  if (bieuMauDangMo !== null) {
    phanTuBieuMau = (
      <HopThoaiBieuMauNguoiDung
        mode={bieuMauDangMo.mode}
        user={bieuMauDangMo.user}
        onClose={function () {
          capNhatBieuMau(null);
        }}
      />
    );
  }

  // Phần tử này hiển thị hộp thoại chi tiết người dùng.
  let phanTuChiTiet = null;

  if (maNguoiDungXem !== null) {
    phanTuChiTiet = (
      <HopThoaiChiTietNguoiDung
        userId={maNguoiDungXem}
        onClose={function () {
          capNhatMaNguoiDungXem(null);
        }}
      />
    );
  }

  // Phần tử này hiển thị hộp thoại xác nhận xoá người dùng.
  let phanTuXacNhanXoa = null;

  if (nguoiDungDangXoa !== null) {
    phanTuXacNhanXoa = (
      <HopThoaiXoaNguoiDung
        user={nguoiDungDangXoa}
        onClose={function () {
          capNhatNguoiDungDangXoa(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="panel__head">
        <div>
          <p className="eyebrow-free">Cộng đồng</p>
          <h1>Quản lý người dùng</h1>
        </div>
        <div className="panel__head-actions">
          <button
            className="btn btn--primary btn--sm"
            type="button"
            onClick={function () {
              capNhatBieuMau({ mode: "create", user: null });
            }}
          >
            <Plus size={15} /> Thêm tài khoản
          </button>
        </div>
      </div>

      <div className="stat-grid stat-grid--dashboard">
        <OChiSoQuanTri
          icon={Users}
          tone="var(--blue)"
          value={laySoLieuQuanTri(duLieuThongKe.totalUsers)}
          label="Tổng người dùng"
          meta="Không tính tài khoản đã xoá mềm"
        />
        <OChiSoQuanTri
          icon={UserCheck}
          tone="var(--green)"
          value={laySoLieuQuanTri(duLieuThongKe.activeUsers)}
          label="Đang hoạt động"
          meta="Có thể đăng nhập và đặt hàng"
        />
        <OChiSoQuanTri
          icon={Lock}
          tone="var(--red)"
          value={laySoLieuQuanTri(duLieuThongKe.lockedUsers)}
          label="Đã khoá"
          meta="Không thể đăng nhập hoặc đặt hàng"
        />
        <OChiSoQuanTri
          icon={ShieldCheck}
          tone="var(--ink)"
          value={laySoLieuQuanTri(duLieuThongKe.adminUsers)}
          label="Quản trị viên"
          meta="Có quyền truy cập khu vực quản trị"
        />
        <OChiSoQuanTri
          icon={User}
          tone="var(--green-dark)"
          value={laySoLieuQuanTri(duLieuThongKe.buyerUsers)}
          label="Người mua"
          meta="Tài khoản khách hàng"
        />
      </div>

      {phanTuLoiThongKe}

      <section className="panel-card">
        <div className="filter-tabs panel-card__tabs">{cacTabVaiTro}</div>

        <div className="panel-toolbar admin-toolbar-pad">
          <label className="search-inline">
            <Search size={15} className="muted" />
            <input
              type="search"
              value={tuKhoa}
              onChange={xuLyThayDoiTuKhoa}
              placeholder="Tìm theo email, họ tên hoặc số điện thoại…"
              aria-label="Tìm người dùng"
            />
          </label>
          <select
            className="select admin-status-select"
            value={trangThaiDangLoc}
            onChange={xuLyThayDoiTrangThaiLoc}
            aria-label="Lọc trạng thái"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Đã khoá</option>
          </select>
          {phanTuDangCapNhat}
        </div>

        {phanTuDangTai}
        {phanTuLoi}
        {phanTuRong}
        {phanTuBangNguoiDung}
      </section>

      {phanTuHopThoai}
      {phanTuBieuMau}
      {phanTuChiTiet}
      {phanTuXacNhanXoa}
    </div>
  );
}
