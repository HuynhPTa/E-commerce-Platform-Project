import { useQuery } from "@tanstack/react-query";
import { layChiTietDonHang, layDanhSachDonHang } from "../api/orderApi";

// Hook này nhận vào trạng thái đăng nhập, bộ lọc và số trang,
// gọi API lấy danh sách đơn hàng khi người dùng đã đăng nhập
// và trả về kết quả truy vấn để trang đơn hàng sử dụng.
export function useDanhSachDonHang(daDangNhap, trangThaiLoc, soTrang) {
  return useQuery({
    queryKey: ["orders", trangThaiLoc, soTrang],
    queryFn: function () {
      const thamSoLoc = {
        status: trangThaiLoc,
        page: soTrang,
        size: 5,
      };

      return layDanhSachDonHang(thamSoLoc);
    },
    enabled: daDangNhap,
    retry: false,
  });
}

// Hook này nhận vào mã đơn hàng và trạng thái đăng nhập,
// gọi API lấy chi tiết đơn khi mã hợp lệ
// và trả về kết quả truy vấn để trang chi tiết đơn hàng sử dụng.
export function useChiTietDonHang(maDonHang, daDangNhap) {
  // Biến này cho biết có được phép gọi API chi tiết đơn hay không.
  let choPhepGoiApi = false;

  if (daDangNhap === true) {
    if (Number.isInteger(maDonHang) === true) {
      if (maDonHang > 0) {
        choPhepGoiApi = true;
      }
    }
  }

  return useQuery({
    queryKey: ["order-detail", maDonHang],
    queryFn: function () {
      return layChiTietDonHang(maDonHang);
    },
    enabled: choPhepGoiApi,
    retry: false,
  });
}
