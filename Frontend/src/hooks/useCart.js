import { useQuery } from "@tanstack/react-query";
import { layGioHang } from "../api/cartApi";

// Hook này nhận vào trạng thái đăng nhập,
// gọi API lấy giỏ hàng khi người dùng đã đăng nhập
// và trả về kết quả truy vấn để trang giỏ hàng sử dụng.
export function useGioHang(daDangNhap) {
  return useQuery({
    queryKey: ["cart"],
    queryFn: layGioHang,
    enabled: daDangNhap,
    retry: false,
  });
}
