import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CircleAlert } from "lucide-react";
import { dangKy } from "../api/authApi.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import { useAuth } from "../hooks/useAuth.js";

// Địa chỉ đăng nhập Google của backend hiện có.
const DUONG_DAN_DANG_NHAP_GOOGLE =
  "http://localhost:8080/oauth2/authorization/google";

// Hàm này tách họ và tên từ một chuỗi họ tên đầy đủ.
// Phần đầu tiên được coi là họ, các phần còn lại là tên.
function tachHoTen(hoTen) {
  const hoTenDaCat = hoTen.trim();
  const cacPhan = hoTenDaCat.split(/\s+/);

  let ho = "";
  let ten = "";

  if (cacPhan.length > 0) {
    ho = cacPhan[0];
  }

  if (cacPhan.length > 1) {
    const cacPhanTen = cacPhan.slice(1);
    ten = cacPhanTen.join(" ");
  }

  return {
    firstName: ho,
    lastName: ten,
  };
}

// Thành phần này hiển thị trang đăng ký tài khoản của cửa hàng.
export default function TrangDangKy() {
  // useNavigate trả về hàm dùng để chuyển trang bằng mã lệnh.
  const hamDieuHuong = useNavigate();

  // Hook này trả về trạng thái đăng nhập hiện tại của người dùng.
  const trangThaiDangNhap = useAuth();

  // Trạng thái này lưu họ tên người dùng nhập.
  const trangThaiHoTen = useState("");

  // Biến này lưu họ tên đang nhập.
  const hoTen = trangThaiHoTen[0];

  // Biến này lưu hàm cập nhật họ tên.
  const capNhatHoTen = trangThaiHoTen[1];

  // Trạng thái này lưu email người dùng nhập.
  const trangThaiEmail = useState("");

  // Biến này lưu email đang nhập.
  const email = trangThaiEmail[0];

  // Biến này lưu hàm cập nhật email.
  const capNhatEmail = trangThaiEmail[1];

  // Trạng thái này lưu số điện thoại người dùng nhập.
  const trangThaiSoDienThoai = useState("");

  // Biến này lưu số điện thoại đang nhập.
  const soDienThoai = trangThaiSoDienThoai[0];

  // Biến này lưu hàm cập nhật số điện thoại.
  const capNhatSoDienThoai = trangThaiSoDienThoai[1];

  // Trạng thái này lưu mật khẩu người dùng nhập.
  const trangThaiMatKhau = useState("");

  // Biến này lưu mật khẩu đang nhập.
  const matKhau = trangThaiMatKhau[0];

  // Biến này lưu hàm cập nhật mật khẩu.
  const capNhatMatKhau = trangThaiMatKhau[1];

  // Trạng thái này lưu thông báo lỗi hiển thị trên biểu mẫu.
  const trangThaiLoi = useState("");

  // Biến này lưu nội dung lỗi hiện tại.
  const noiDungLoi = trangThaiLoi[0];

  // Biến này lưu hàm cập nhật nội dung lỗi.
  const capNhatNoiDungLoi = trangThaiLoi[1];

  // Trạng thái này cho biết biểu mẫu đang gửi lên backend hay không.
  const trangThaiDangGui = useState(false);

  // Biến này lưu trạng thái đang gửi.
  const dangGui = trangThaiDangGui[0];

  // Biến này lưu hàm cập nhật trạng thái đang gửi.
  const capNhatDangGui = trangThaiDangGui[1];

  // Nếu đã đăng nhập thì không hiển thị lại biểu mẫu đăng ký.
  if (trangThaiDangNhap.daDangNhap === true) {
    return <Navigate to="/" replace />;
  }

  // Hàm này xử lý khi người dùng gửi biểu mẫu đăng ký.
  async function xuLyGuiDangKy(suKienGui) {
    suKienGui.preventDefault();
    capNhatNoiDungLoi("");

    const hoTenDaCat = hoTen.trim();
    const emailDaCat = email.trim();
    const soDienThoaiDaCat = soDienThoai.trim();
    const matKhauDaNhap = matKhau;

    if (hoTenDaCat === "") {
      capNhatNoiDungLoi("Vui lòng nhập họ và tên.");
      return;
    }

    if (emailDaCat === "") {
      capNhatNoiDungLoi("Vui lòng nhập email.");
      return;
    }

    if (soDienThoaiDaCat === "") {
      capNhatNoiDungLoi("Vui lòng nhập số điện thoại.");
      return;
    }

    if (matKhauDaNhap.length < 6) {
      capNhatNoiDungLoi("Mật khẩu cần có ít nhất 6 ký tự.");
      return;
    }

    capNhatDangGui(true);

    try {
      const phanHoTen = tachHoTen(hoTenDaCat);

      const duLieuDangKy = {
        email: emailDaCat,
        password: matKhauDaNhap,
        firstName: phanHoTen.firstName,
        lastName: phanHoTen.lastName,
        phone: soDienThoaiDaCat,
      };

      const ketQua = await dangKy(duLieuDangKy);

      if (ketQua.success !== true) {
        let thongDiep = "Đăng ký thất bại. Vui lòng thử lại.";

        if (typeof ketQua.message === "string") {
          if (ketQua.message !== "") {
            thongDiep = ketQua.message;
          }
        }

        capNhatNoiDungLoi(thongDiep);
        capNhatDangGui(false);
        return;
      }

      capNhatDangGui(false);
      hamDieuHuong("/login?registered=1", { replace: true });
    } catch (loi) {
      const thongDiepLoi = layThongDiepLoiBackend(
        loi,
        "Đăng ký thất bại. Vui lòng kiểm tra thông tin và thử lại.",
      );
      capNhatNoiDungLoi(thongDiepLoi);
      capNhatDangGui(false);
    }
  }

  // Phần tử này hiển thị lỗi khi biểu mẫu có nội dung lỗi.
  let phanTuLoi = null;

  if (noiDungLoi !== "") {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <CircleAlert className="icon icon--sm" />
        <div>{noiDungLoi}</div>
      </div>
    );
  }

  // Biến này lưu nhãn của nút gửi biểu mẫu.
  let nhanNutDangKy = "Tạo tài khoản";

  if (dangGui === true) {
    nhanNutDangKy = "Đang tạo tài khoản…";
  }

  return (
    <div className="auth">
      <div className="auth__media">
        <img src="/assets/books.jpg" alt="Kệ sách trong một hiệu sách cũ" />
        <div className="auth__media-caption">
          Một tài khoản cho đơn hàng, địa chỉ và đánh giá của bạn.
        </div>
      </div>

      <div className="auth__panel">
        <div className="auth__box">
          <h1>Đăng ký</h1>
          <p>Tạo tài khoản để theo dõi đơn hàng và lưu địa chỉ giao hàng.</p>

          <a className="google-btn" href={DUONG_DAN_DANG_NHAP_GOOGLE}>
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="var(--google-blue)"
                d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615Z"
              />
              <path
                fill="var(--google-green)"
                d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18Z"
              />
              <path
                fill="var(--google-yellow)"
                d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71Z"
              />
              <path
                fill="var(--google-red)"
                d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795Z"
              />
            </svg>
            Tiếp tục với Google
          </a>

          <div className="auth-divider">hoặc</div>

          {phanTuLoi}

          <form className="auth-form" onSubmit={xuLyGuiDangKy}>
            <div className="field">
              <label htmlFor="reg-name">Họ và tên</label>
              <input
                className="input"
                id="reg-name"
                name="fullName"
                autoComplete="name"
                placeholder="Nguyễn Minh Anh"
                value={hoTen}
                onChange={function (suKienNhap) {
                  capNhatHoTen(suKienNhap.target.value);
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="reg-email">Email</label>
              <input
                className="input"
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ban@example.com"
                value={email}
                onChange={function (suKienNhap) {
                  capNhatEmail(suKienNhap.target.value);
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="reg-phone">Số điện thoại</label>
              <input
                className="input"
                id="reg-phone"
                name="phone"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="09xx xxx xxx"
                value={soDienThoai}
                onChange={function (suKienNhap) {
                  capNhatSoDienThoai(suKienNhap.target.value);
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="reg-password">Mật khẩu</label>
              <input
                className="input"
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
                value={matKhau}
                onChange={function (suKienNhap) {
                  capNhatMatKhau(suKienNhap.target.value);
                }}
                minLength={6}
                required
              />
            </div>

            <button
              className="btn btn--primary"
              type="submit"
              disabled={dangGui}
            >
              {nhanNutDangKy}
            </button>
          </form>

          <p className="auth-switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
          <p className="auth-note">
            Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng và chính sách
            bảo mật của MarketHub.
          </p>
        </div>
      </div>
    </div>
  );
}
