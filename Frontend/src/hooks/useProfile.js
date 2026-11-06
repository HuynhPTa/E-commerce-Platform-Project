import { useQuery } from "@tanstack/react-query";
import { layThongTinCaNhan } from "../api/authApi";

// Hook này nhận vào trạng thái đăng nhập,
// gọi API lấy hồ sơ cá nhân khi người dùng đã đăng nhập
// và trả về kết quả truy vấn để trang tài khoản sử dụng.
export function useHoSoCaNhan(daDangNhap) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: layThongTinCaNhan,
    enabled: daDangNhap,
    retry: false,
  });
}
