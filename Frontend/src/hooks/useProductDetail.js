import { useQuery } from "@tanstack/react-query";
import { laySanPhamTheoMa } from "../api/productApi";

// Hook này nhận vào mã sản phẩm,
// gọi API lấy chi tiết sản phẩm và trả về kết quả truy vấn.
export function useChiTietSanPham(maSanPham) {
  // Hàm này gọi API chi tiết sản phẩm với mã đã nhận.
  function goiLayChiTietSanPham() {
    return laySanPhamTheoMa(maSanPham);
  }

  // Biến này cho biết mã sản phẩm có hợp lệ để gọi API hay không.
  let duocPhepGoi = false;

  if (Number.isInteger(maSanPham) === true) {
    if (maSanPham > 0) {
      duocPhepGoi = true;
    }
  }

  return useQuery({
    queryKey: ["product", maSanPham],
    queryFn: goiLayChiTietSanPham,
    enabled: duocPhepGoi,
    staleTime: 3 * 60 * 1000,
  });
}
