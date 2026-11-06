import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert } from "lucide-react";
import { layThongTinCaNhan } from "../api/authApi.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import { luuPhienDangNhap, xoaPhienDangNhap } from "../lib/authStorage.js";

// Trang này nhận token do backend chuyển về sau khi Google hoặc Facebook xác thực.
export default function TrangOAuth2Redirect() {
  // useSearchParams trả về bộ tham số trên đường dẫn hiện tại.
  const capThamSoTimKiem = useSearchParams();

  // Biến này lưu bộ tham số tìm kiếm hiện tại.
  const thamSoTimKiem = capThamSoTimKiem[0];

  // useNavigate trả về hàm dùng để chuyển trang bằng mã lệnh.
  const hamDieuHuong = useNavigate();

  // Trạng thái này lưu thông báo lỗi hiển thị cho người dùng.
  const trangThaiLoi = useState("");

  // Biến này lưu nội dung lỗi hiện tại.
  const noiDungLoi = trangThaiLoi[0];

  // Biến này lưu hàm cập nhật nội dung lỗi.
  const capNhatNoiDungLoi = trangThaiLoi[1];

  // Trạng thái này cho biết trang đang xử lý token hay không.
  const trangThaiDangXuLy = useState(true);

  // Biến này lưu trạng thái đang xử lý.
  const dangXuLy = trangThaiDangXuLy[0];

  // Biến này lưu hàm cập nhật trạng thái đang xử lý.
  const capNhatDangXuLy = trangThaiDangXuLy[1];

  // Ref này giữ trạng thái đã bắt đầu xử lý hay chưa để tránh gọi hai lần.
  const daBatDauXuLy = useRef(false);

  // Biến này lưu token do backend gửi kèm trên đường dẫn.
  const token = thamSoTimKiem.get("token");

  // Biến này lưu thông báo khi đường dẫn không có token.
  let thongDiepThieuToken = "";

  if (token === null) {
    thongDiepThieuToken = "Thiếu token đăng nhập. Vui lòng đăng nhập lại.";
  } else if (token === "") {
    thongDiepThieuToken = "Thiếu token đăng nhập. Vui lòng đăng nhập lại.";
  }

  // useEffect xử lý token sau khi trang được gắn vào giao diện.
  useEffect(function () {
    if (daBatDauXuLy.current === true) {
      return;
    }

    daBatDauXuLy.current = true;

    if (token === null) {
      return;
    }

    if (token === "") {
      return;
    }

    // Hàm này lưu token mới rồi lấy hồ sơ thật của tài khoản.
    async function xuLyToken() {
      // Xoá phiên cũ trước khi lưu token mới để tránh lẫn thông tin người dùng.
      xoaPhienDangNhap();
      luuPhienDangNhap(token, null);

      try {
        // Biến này lưu hồ sơ thật của tài khoản vừa xác thực.
        const nguoiDung = await layThongTinCaNhan();

        luuPhienDangNhap(token, nguoiDung);
        capNhatDangXuLy(false);
        hamDieuHuong("/", { replace: true });
      } catch (loi) {
        // Biến này lưu thông điệp lỗi thân thiện để hiển thị.
        const thongDiepLoi = layThongDiepLoiBackend(
          loi,
          "Không lấy được thông tin tài khoản. Vui lòng đăng nhập lại.",
        );

        xoaPhienDangNhap();
        capNhatNoiDungLoi(thongDiepLoi);
        capNhatDangXuLy(false);
      }
    }

    xuLyToken();
  }, [
    token,
    hamDieuHuong,
    capNhatNoiDungLoi,
    capNhatDangXuLy,
  ]);

  // Biến này lưu thông báo lỗi cuối cùng cần hiển thị.
  let thongDiepHienThi = thongDiepThieuToken;

  if (noiDungLoi !== "") {
    thongDiepHienThi = noiDungLoi;
  }

  // Phần tử này hiển thị lỗi khi thiếu token hoặc không lấy được hồ sơ.
  if (thongDiepHienThi !== "") {
    return (
      <div className="container">
        <div className="catalog-state" role="alert">
          <CircleAlert className="icon" />
          <h2>Đăng nhập chưa hoàn tất</h2>
          <p>{thongDiepHienThi}</p>
          <Link className="btn" to="/login">
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // Phần tử này hiển thị trạng thái đang xử lý token.
  if (dangXuLy === true) {
    return (
      <div className="container">
        <div className="catalog-state" role="status">
          <h2>Đang hoàn tất đăng nhập…</h2>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  return null;
}
