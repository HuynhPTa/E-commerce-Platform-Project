import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { CircleAlert, CircleCheck } from "lucide-react";
import { dangNhap } from "../api/authApi.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import { useAuth } from "../hooks/useAuth.js";
import { luuPhienDangNhap } from "../lib/authStorage.js";

// Địa chỉ đăng nhập Google của backend hiện có.
const DUONG_DAN_DANG_NHAP_GOOGLE =
  "http://localhost:8080/oauth2/authorization/google";

// Hàm này đọc đường dẫn cần quay lại sau khi đăng nhập và chặn đường dẫn lạ.
function layDuongDanQuayLai(thamSoTimKiem) {
  const duongDan = thamSoTimKiem.get("redirect");

  if (duongDan === null) {
    return "/";
  }

  if (duongDan === "") {
    return "/";
  }

  if (duongDan.startsWith("/") === false) {
    return "/";
  }

  if (duongDan.startsWith("//") === true) {
    return "/";
  }

  return duongDan;
}

// Thành phần này hiển thị trang đăng nhập của cửa hàng.
export default function TrangDangNhap() {
  // useSearchParams trả về bộ tham số trên đường dẫn hiện tại.
  const capThamSoTimKiem = useSearchParams();

  // Biến này lưu bộ tham số tìm kiếm hiện tại.
  const thamSoTimKiem = capThamSoTimKiem[0];

  // useNavigate trả về hàm dùng để chuyển trang bằng mã lệnh.
  const hamDieuHuong = useNavigate();

  // Hook này trả về trạng thái đăng nhập hiện tại của người dùng.
  const trangThaiDangNhap = useAuth();

  // Trạng thái này lưu email người dùng nhập.
  const trangThaiEmail = useState("");

  // Biến này lưu email đang nhập.
  const email = trangThaiEmail[0];

  // Biến này lưu hàm cập nhật email.
  const capNhatEmail = trangThaiEmail[1];

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

  // Biến này lưu đường dẫn cần quay lại sau khi đăng nhập thành công.
  const duongDanQuayLai = layDuongDanQuayLai(thamSoTimKiem);

  // Biến này lưu nơi cần chuyển tới khi tài khoản đã đăng nhập.
  let duongDanKhiDaDangNhap = duongDanQuayLai;

  // Tránh quay lại chính trang đăng nhập để không bị lặp chuyển hướng.
  if (duongDanKhiDaDangNhap.startsWith("/login") === true) {
    duongDanKhiDaDangNhap = "/";
  }

  // Nếu đã đăng nhập thì không hiển thị lại biểu mẫu đăng nhập.
  if (trangThaiDangNhap.daDangNhap === true) {
    return <Navigate to={duongDanKhiDaDangNhap} replace />;
  }

  // Hàm này xử lý khi người dùng gửi biểu mẫu đăng nhập.
  async function xuLyGuiDangNhap(suKienGui) {
    suKienGui.preventDefault();
    capNhatNoiDungLoi("");

    const emailDaCat = email.trim();
    const matKhauDaNhap = matKhau;

    if (emailDaCat === "") {
      capNhatNoiDungLoi("Vui lòng nhập email.");
      return;
    }

    if (matKhauDaNhap === "") {
      capNhatNoiDungLoi("Vui lòng nhập mật khẩu.");
      return;
    }

    capNhatDangGui(true);

    try {
      const duLieuDangNhap = {
        email: emailDaCat,
        password: matKhauDaNhap,
      };

      const ketQua = await dangNhap(duLieuDangNhap);

      if (ketQua.success !== true) {
        let thongDiep = "Đăng nhập thất bại. Vui lòng thử lại.";

        if (typeof ketQua.message === "string") {
          if (ketQua.message !== "") {
            thongDiep = ketQua.message;
          }
        }

        capNhatNoiDungLoi(thongDiep);
        capNhatDangGui(false);
        return;
      }

      if (ketQua.token === undefined) {
        capNhatNoiDungLoi("Backend không trả về token đăng nhập.");
        capNhatDangGui(false);
        return;
      }

      if (ketQua.token === null) {
        capNhatNoiDungLoi("Backend không trả về token đăng nhập.");
        capNhatDangGui(false);
        return;
      }

      if (ketQua.token === "") {
        capNhatNoiDungLoi("Backend không trả về token đăng nhập.");
        capNhatDangGui(false);
        return;
      }

      luuPhienDangNhap(ketQua.token, ketQua.userInfo);
      capNhatDangGui(false);
      hamDieuHuong(duongDanQuayLai, { replace: true });
    } catch (loi) {
      const thongDiepLoi = layThongDiepLoiBackend(
        loi,
        "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.",
      );
      capNhatNoiDungLoi(thongDiepLoi);
      capNhatDangGui(false);
    }
  }

  // Phần tử này hiển thị thông báo đăng ký thành công khi quay lại từ trang đăng ký.
  let phanTuDangKyThanhCong = null;
  const daDangKy = thamSoTimKiem.get("registered");

  if (daDangKy === "1") {
    phanTuDangKyThanhCong = (
      <div className="alert alert--success" role="status">
        <CircleCheck className="icon icon--sm" />
        <div>
          <strong>Đăng ký thành công.</strong> Hãy đăng nhập bằng tài khoản vừa
          tạo.
        </div>
      </div>
    );
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
  let nhanNutDangNhap = "Đăng nhập";

  if (dangGui === true) {
    nhanNutDangNhap = "Đang đăng nhập…";
  }

  return (
    <div className="auth">
      <div className="auth__media">
        <img src="/assets/ceramics.jpg" alt="Gốm sứ trong xưởng làm gốm" />
        <div className="auth__media-caption">
          Đồ tốt, chọn kỹ. Một cửa hàng, một chuẩn chọn.
        </div>
      </div>

      <div className="auth__panel">
        <div className="auth__box">
          <h1>Đăng nhập</h1>
          <p>
            Tiếp tục với Google để mua sắm nhanh hơn, hoặc dùng email của bạn.
          </p>

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

          {phanTuDangKyThanhCong}
          {phanTuLoi}

          <form className="auth-form" onSubmit={xuLyGuiDangNhap}>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                className="input"
                id="login-email"
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
              <label htmlFor="login-password">Mật khẩu</label>
              <input
                className="input"
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={matKhau}
                onChange={function (suKienNhap) {
                  capNhatMatKhau(suKienNhap.target.value);
                }}
                required
              />
            </div>

            <button
              className="btn btn--primary"
              type="submit"
              disabled={dangGui}
            >
              {nhanNutDangNhap}
            </button>
          </form>

          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
          <p className="auth-note">
            Lần đầu đăng nhập bằng Google, MarketHub sẽ tạo tài khoản từ email và
            tên hiển thị của bạn. Chúng tôi không nhận mật khẩu Google.
          </p>
        </div>
      </div>
    </div>
  );
}
