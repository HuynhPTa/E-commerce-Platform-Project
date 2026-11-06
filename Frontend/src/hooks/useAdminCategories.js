import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  capNhatDanhMucQuanTri,
  layDanhSachDanhMucPhang,
  layThongKeDanhMucQuanTri,
  taoDanhMucQuanTri,
  xoaDanhMucQuanTri,
} from "../api/adminCategoryApi";

// Khoá này dùng chung cho cả cây danh mục công khai và danh sách phẳng.
export const KHOA_DANH_MUC = ["categories"];

// Hook này lấy danh sách danh mục phẳng theo thứ tự cây.
export function useDanhSachDanhMucPhang() {
  return useQuery({
    queryKey: ["categories", "flat"],
    queryFn: layDanhSachDanhMucPhang,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook này lấy số liệu thống kê của module danh mục.
export function useThongKeDanhMucQuanTri() {
  return useQuery({
    queryKey: ["categories", "stats"],
    queryFn: layThongKeDanhMucQuanTri,
    staleTime: 20 * 1000,
  });
}

// Hàm này tạo hook thay đổi danh mục và làm mới dữ liệu sau khi thành công.
function useThayDoiDanhMuc(hamThayDoi) {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: hamThayDoi,
    onSuccess: function () {
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_DANH_MUC });
      boQuanLyTruyVan.invalidateQueries({ queryKey: ["products"] });
      boQuanLyTruyVan.invalidateQueries({
        queryKey: ["product-count-by-category"],
      });
    },
  });
}

// Hook này tạo danh mục mới.
export function useTaoDanhMucQuanTri() {
  return useThayDoiDanhMuc(taoDanhMucQuanTri);
}

// Hook này cập nhật danh mục đã có.
export function useCapNhatDanhMucQuanTri() {
  return useThayDoiDanhMuc(capNhatDanhMucQuanTri);
}

// Hook này xoá danh mục.
export function useXoaDanhMucQuanTri() {
  return useThayDoiDanhMuc(xoaDanhMucQuanTri);
}
