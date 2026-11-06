import { useQuery } from "@tanstack/react-query";
import { layDanhGiaSanPham } from "../api/reviewApi";

// Hook này nhận vào mã sản phẩm,
// gọi API lấy đánh giá và trả về kết quả truy vấn.
export function useDanhGiaSanPham(maSanPham) {
  // Hàm này gọi API đánh giá với mã sản phẩm đã nhận.
  function goiLayDanhGiaSanPham() {
    return layDanhGiaSanPham(maSanPham);
  }

  // Biến này cho biết mã sản phẩm có hợp lệ để gọi API hay không.
  let duocPhepGoi = false;

  if (Number.isInteger(maSanPham) === true) {
    if (maSanPham > 0) {
      duocPhepGoi = true;
    }
  }

  return useQuery({
    queryKey: ["product-reviews", maSanPham],
    queryFn: goiLayDanhGiaSanPham,
    enabled: duocPhepGoi,
    staleTime: 2 * 60 * 1000,
  });
}
