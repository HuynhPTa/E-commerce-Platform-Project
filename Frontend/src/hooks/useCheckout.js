import { useQuery } from "@tanstack/react-query";
import { layDanhSachDiaChi } from "../api/addressApi";
import { layKetQuaThanhToan } from "../api/checkoutApi";

// Hook này nhận vào trạng thái đăng nhập,
// gọi API lấy địa chỉ đã lưu khi người dùng đã đăng nhập
// và trả về kết quả truy vấn để trang thanh toán sử dụng.
export function useDanhSachDiaChi(daDangNhap) {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: layDanhSachDiaChi,
    enabled: daDangNhap,
    retry: false,
  });
}

// Hook này nhận vào mã phiên thanh toán và trạng thái đăng nhập,
// gọi API đọc kết quả thật khi mã hợp lệ
// và trả về kết quả truy vấn để trang kết quả sử dụng.
export function useKetQuaThanhToan(maPhienThanhToan, daDangNhap) {
  // Biến này cho biết có được phép gọi API kết quả hay không.
  let choPhepGoiApi = false;

  if (daDangNhap === true) {
    if (Number.isInteger(maPhienThanhToan) === true) {
      if (maPhienThanhToan > 0) {
        choPhepGoiApi = true;
      }
    }
  }

  return useQuery({
    queryKey: ["checkout-result", maPhienThanhToan],
    queryFn: function () {
      return layKetQuaThanhToan(maPhienThanhToan);
    },
    enabled: choPhepGoiApi,
    retry: false,
  });
}
