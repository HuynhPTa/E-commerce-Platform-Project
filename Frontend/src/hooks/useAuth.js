import { useEffect, useState } from "react";
import {
  docNguoiDungDangNhap,
  laDaDangNhap,
  SU_KIEN_THAY_DOI_DANG_NHAP,
} from "../lib/authStorage.js";

// Hàm này tạo trạng thái đăng nhập từ dữ liệu đang lưu trong trình duyệt.
function taoTrangThaiDangNhap() {
  // Biến này cho biết trình duyệt đang có token đăng nhập hay không.
  const daDangNhap = laDaDangNhap();

  // Biến này lưu thông tin người dùng, mặc định là null khi chưa đăng nhập.
  let nguoiDung = null;

  if (daDangNhap === true) {
    nguoiDung = docNguoiDungDangNhap();
  }

  return {
    daDangNhap: daDangNhap,
    nguoiDung: nguoiDung,
  };
}

// Hook này trả về trạng thái đăng nhập và tự cập nhật khi phiên thay đổi.
export function useAuth() {
  // useState tạo trạng thái đăng nhập ban đầu.
  const trangThaiDangNhap = useState(taoTrangThaiDangNhap);

  // Biến này lưu trạng thái đăng nhập hiện tại.
  const trangThaiHienTai = trangThaiDangNhap[0];

  // Biến này lưu hàm cập nhật trạng thái đăng nhập.
  const capNhatTrangThai = trangThaiDangNhap[1];

  // useEffect gắn và gỡ các trình nghe sự kiện khi thành phần còn hiển thị.
  useEffect(function () {
    // Hàm này đọc lại trạng thái mỗi khi phiên đăng nhập thay đổi.
    function xuLyThayDoiDangNhap() {
      capNhatTrangThai(taoTrangThaiDangNhap());
    }

    window.addEventListener(SU_KIEN_THAY_DOI_DANG_NHAP, xuLyThayDoiDangNhap);
    window.addEventListener("storage", xuLyThayDoiDangNhap);

    return function () {
      window.removeEventListener(
        SU_KIEN_THAY_DOI_DANG_NHAP,
        xuLyThayDoiDangNhap,
      );
      window.removeEventListener("storage", xuLyThayDoiDangNhap);
    };
  }, [capNhatTrangThai]);

  return trangThaiHienTai;
}
