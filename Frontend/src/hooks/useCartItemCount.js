import { useQuery } from "@tanstack/react-query";
import { layGioHang } from "../api/cartApi";

// Hook này đọc token đăng nhập, gọi API lấy giỏ hàng khi đã đăng nhập,
// rồi trả về tổng số mặt hàng đang có trong giỏ.
export function useSoLuongMatHangTrongGio() {
  // Biến này lưu token đăng nhập đang được lưu trong trình duyệt.
  const accessToken = localStorage.getItem("access_token");

  // Biến này cho biết người dùng đã đăng nhập hay chưa.
  let daDangNhap = false;

  // Nếu token tồn tại và không phải chuỗi rỗng thì coi như đã đăng nhập.
  if (accessToken !== undefined) {
    if (accessToken !== null) {
      if (accessToken !== "undefined") {
        if (accessToken !== "") {
          daDangNhap = true;
        }
      }
    }
  }

  // Biến này lưu kết quả truy vấn giỏ hàng từ React Query.
  const ketQuaGioHang = useQuery({
    queryKey: ["cart"],
    queryFn: layGioHang,
    enabled: daDangNhap,
    retry: false,
  });

  // Biến này lưu danh sách mặt hàng sau khi kiểm tra dữ liệu trả về.
  let danhSachMatHang = [];

  // Nếu dữ liệu trả về là một mảng thì mới dùng được.
  if (ketQuaGioHang.data !== undefined) {
    if (Array.isArray(ketQuaGioHang.data) === true) {
      danhSachMatHang = ketQuaGioHang.data;
    }
  }

  return danhSachMatHang.length;
}
