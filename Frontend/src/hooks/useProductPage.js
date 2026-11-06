import { useQuery } from "@tanstack/react-query";
import { layTrangSanPham } from "../api/productApi";

// Hàm này nhận vào dữ liệu của lần tải trước và giữ nguyên dữ liệu đó
// trong lúc React Query đang tải dữ liệu mới.
function giuDuLieuTruoc(duLieuTruoc) {
  return duLieuTruoc;
}

// Hook này nhận vào bộ lọc sản phẩm,
// gọi API lấy một trang sản phẩm và trả về kết quả truy vấn.
export function useTrangSanPham(boLocSanPham) {
  // Hàm này gọi API lấy trang sản phẩm với bộ lọc đã nhận.
  function goiLayTrangSanPham() {
    return layTrangSanPham(boLocSanPham);
  }

  return useQuery({
    queryKey: ["products", boLocSanPham],
    queryFn: goiLayTrangSanPham,
    placeholderData: giuDuLieuTruoc,
    staleTime: 3 * 60 * 1000,
  });
}
