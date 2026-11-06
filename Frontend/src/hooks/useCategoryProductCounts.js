import { useQueries } from "@tanstack/react-query";
import { layTrangSanPham } from "../api/productApi";

// Hook này nhận vào danh sách danh mục, tạo một truy vấn đếm sản phẩm cho từng danh mục,
// rồi trả về một đối tượng ánh xạ slug danh mục sang tổng số sản phẩm.
export function useSoLuongSanPhamTheoDanhMuc(danhSachDanhMuc) {
  // Biến này lưu danh sách danh mục an toàn để tránh lỗi khi dữ liệu chưa tải xong.
  let danhSachDanhMucAnToan = [];

  if (Array.isArray(danhSachDanhMuc) === true) {
    danhSachDanhMucAnToan = danhSachDanhMuc;
  }

  // Biến này lưu cấu hình của tất cả truy vấn đếm sản phẩm.
  const cacCauHinhTruyVan = [];

  for (const danhMuc of danhSachDanhMucAnToan) {
    // Hàm này gọi API lấy tổng số sản phẩm của một danh mục.
    function goiLaySoLuongSanPham() {
      return layTrangSanPham({
        category: danhMuc.slug,
        page: 1,
        size: 1,
      });
    }

    // Biến này cho biết danh mục có slug hợp lệ để gọi API hay không.
    let duocPhepGoi = false;

    if (danhMuc.slug !== undefined) {
      if (danhMuc.slug !== null) {
        if (danhMuc.slug !== "") {
          duocPhepGoi = true;
        }
      }
    }

    // Biến này lưu cấu hình cho một truy vấn đếm sản phẩm.
    const cauHinhTruyVan = {
      queryKey: ["product-count-by-category", danhMuc.slug],
      queryFn: goiLaySoLuongSanPham,
      staleTime: 5 * 60 * 1000,
      retry: false,
      enabled: duocPhepGoi,
    };

    cacCauHinhTruyVan.push(cauHinhTruyVan);
  }

  // Biến này lưu kết quả của toàn bộ truy vấn đếm sản phẩm.
  const ketQuaCacTruyVan = useQueries({
    queries: cacCauHinhTruyVan,
  });

  // Biến này lưu số lượng sản phẩm theo từng slug danh mục.
  const soLuongTheoSlug = {};

  // Biến này lưu vị trí của danh mục đang xử lý trong mảng kết quả.
  let chiSoDanhMuc = 0;

  for (const danhMuc of danhSachDanhMucAnToan) {
    // Biến này lưu kết quả truy vấn tương ứng với danh mục hiện tại.
    const ketQuaTruyVan = ketQuaCacTruyVan[chiSoDanhMuc];

    // Biến này lưu tổng số sản phẩm của danh mục hiện tại.
    let tongSoSanPham = undefined;

    if (ketQuaTruyVan !== undefined) {
      if (ketQuaTruyVan.data !== undefined) {
        tongSoSanPham = ketQuaTruyVan.data.totalItems;
      }
    }

    soLuongTheoSlug[danhMuc.slug] = tongSoSanPham;
    chiSoDanhMuc += 1;
  }

  return soLuongTheoSlug;
}
