import { useQuery } from "@tanstack/react-query";
import { layTrangSanPham } from "../api/productApi";

// Biến này lưu số sản phẩm liên quan cần hiển thị.
const SO_SAN_PHAM_LIEN_QUAN = 4;

// Hook này nhận vào slug danh mục và mã sản phẩm hiện tại,
// gọi API lấy các sản phẩm cùng danh mục rồi loại bỏ sản phẩm hiện tại.
export function useSanPhamLienQuan(slugDanhMuc, maSanPhamHienTai) {
  // Hàm này chọn ra danh sách sản phẩm liên quan từ dữ liệu trang sản phẩm.
  function chonSanPhamLienQuan(trangSanPham) {
    // Biến này lưu danh sách sản phẩm gốc từ backend.
    let danhSachSanPhamGoc = [];

    if (trangSanPham.items !== undefined) {
      if (trangSanPham.items !== null) {
        danhSachSanPhamGoc = trangSanPham.items;
      }
    }

    // Biến này lưu danh sách sản phẩm liên quan sau khi lọc.
    const danhSachSanPhamLienQuan = [];

    for (const sanPham of danhSachSanPhamGoc) {
      // Bỏ qua sản phẩm đang được xem.
      if (sanPham.id !== maSanPhamHienTai) {
        // Chỉ lấy đủ số lượng sản phẩm liên quan cần hiển thị.
        if (danhSachSanPhamLienQuan.length < SO_SAN_PHAM_LIEN_QUAN) {
          danhSachSanPhamLienQuan.push(sanPham);
        }
      }
    }

    return danhSachSanPhamLienQuan;
  }

  // Hàm này gọi API lấy các sản phẩm cùng danh mục.
  function goiLaySanPhamLienQuan() {
    return layTrangSanPham({
      category: slugDanhMuc,
      sort: "best_selling",
      page: 1,
      size: SO_SAN_PHAM_LIEN_QUAN + 1,
    });
  }

  // Biến này cho biết có đủ dữ liệu để gọi API hay không.
  let duocPhepGoi = false;

  if (slugDanhMuc !== undefined) {
    if (slugDanhMuc !== null) {
      if (slugDanhMuc !== "") {
        if (maSanPhamHienTai !== undefined) {
          if (maSanPhamHienTai !== null) {
            duocPhepGoi = true;
          }
        }
      }
    }
  }

  return useQuery({
    queryKey: ["products", "related", slugDanhMuc, maSanPhamHienTai],
    queryFn: goiLaySanPhamLienQuan,
    enabled: duocPhepGoi,
    select: chonSanPhamLienQuan,
    staleTime: 3 * 60 * 1000,
  });
}
