import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  capNhatPhienBanQuanTri,
  capNhatSanPhamQuanTri,
  layChiTietSanPhamQuanTri,
  layDanhSachSanPhamQuanTri,
  layThongKeSanPhamQuanTri,
  taiAnhSanPhamQuanTri,
  taoPhienBanQuanTri,
  taoSanPhamQuanTri,
  xoaAnhSanPhamQuanTri,
  xoaPhienBanQuanTri,
  xoaSanPhamQuanTri,
} from "../api/adminProductApi";
import { KHOA_TONG_QUAN_QUAN_TRI } from "./useAdmin";

// Các khoá này giúp làm mới danh sách và chi tiết sản phẩm sau khi thay đổi.
export const KHOA_SAN_PHAM_QUAN_TRI = ["admin", "products"];
export const KHOA_SAN_PHAM_CONG_KHAI = ["products"];

// Hàm này làm mới mọi dữ liệu có liên quan tới sản phẩm.
function lamMoiDuLieuSanPham(boQuanLyTruyVan, maSanPham) {
  boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_SAN_PHAM_QUAN_TRI });
  boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_SAN_PHAM_CONG_KHAI });
  boQuanLyTruyVan.invalidateQueries({ queryKey: ["product"] });
  boQuanLyTruyVan.invalidateQueries({
    queryKey: ["product-count-by-category"],
  });
  boQuanLyTruyVan.invalidateQueries({ queryKey: ["categories", "stats"] });
  boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_TONG_QUAN_QUAN_TRI });

  if (maSanPham !== null) {
    if (maSanPham !== undefined) {
      boQuanLyTruyVan.invalidateQueries({
        queryKey: ["admin", "product", String(maSanPham)],
      });
    }
  }
}

// Hook này lấy số liệu thống kê của module sản phẩm.
export function useThongKeSanPhamQuanTri() {
  return useQuery({
    queryKey: ["admin", "products", "stats"],
    queryFn: layThongKeSanPhamQuanTri,
    staleTime: 20 * 1000,
  });
}

// Hook này lấy danh sách sản phẩm theo bộ lọc hiện tại.
export function useDanhSachSanPhamQuanTri(thamSo) {
  return useQuery({
    queryKey: ["admin", "products", "list", thamSo],
    queryFn: function () {
      return layDanhSachSanPhamQuanTri(thamSo);
    },
    staleTime: 20 * 1000,
  });
}

// Hook này lấy chi tiết một sản phẩm.
export function useChiTietSanPhamQuanTri(maSanPham) {
  let choPhepGoi = false;

  if (maSanPham !== null) {
    if (maSanPham !== undefined) {
      choPhepGoi = true;
    }
  }

  return useQuery({
    queryKey: ["admin", "product", String(maSanPham)],
    queryFn: function () {
      return layChiTietSanPhamQuanTri(maSanPham);
    },
    enabled: choPhepGoi,
  });
}

// Hook này tạo sản phẩm mới.
export function useTaoSanPhamQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: taoSanPhamQuanTri,
    onSuccess: function (sanPham) {
      let maSanPham = null;

      if (sanPham !== null) {
        if (sanPham !== undefined) {
          maSanPham = sanPham.id;
        }
      }

      lamMoiDuLieuSanPham(boQuanLyTruyVan, maSanPham);
    },
  });
}

// Hook này cập nhật thông tin chung của sản phẩm.
export function useCapNhatSanPhamQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: capNhatSanPhamQuanTri,
    onSuccess: function (sanPham) {
      let maSanPham = null;

      if (sanPham !== null) {
        if (sanPham !== undefined) {
          maSanPham = sanPham.id;
        }
      }

      lamMoiDuLieuSanPham(boQuanLyTruyVan, maSanPham);
    },
  });
}

// Hook này xoá mềm sản phẩm.
export function useXoaSanPhamQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: xoaSanPhamQuanTri,
    onSuccess: function (maSanPham) {
      lamMoiDuLieuSanPham(boQuanLyTruyVan, maSanPham);
    },
  });
}

// Hook này thêm một biến thể cho sản phẩm.
export function useTaoPhienBanQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: taoPhienBanQuanTri,
    onSuccess: function (duLieu, bienSo) {
      lamMoiDuLieuSanPham(boQuanLyTruyVan, bienSo.productId);
    },
  });
}

// Hook này cập nhật một biến thể của sản phẩm.
export function useCapNhatPhienBanQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: capNhatPhienBanQuanTri,
    onSuccess: function (duLieu, bienSo) {
      lamMoiDuLieuSanPham(boQuanLyTruyVan, bienSo.productId);
    },
  });
}

// Hook này xoá một biến thể khỏi sản phẩm.
export function useXoaPhienBanQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: xoaPhienBanQuanTri,
    onSuccess: function (duLieu, bienSo) {
      lamMoiDuLieuSanPham(boQuanLyTruyVan, bienSo.productId);
    },
  });
}

// Hook này tải ảnh lên sản phẩm.
export function useTaiAnhSanPhamQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: taiAnhSanPhamQuanTri,
    onSuccess: function (duLieu, bienSo) {
      lamMoiDuLieuSanPham(boQuanLyTruyVan, bienSo.productId);
    },
  });
}

// Hook này xoá ảnh khỏi sản phẩm.
export function useXoaAnhSanPhamQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: xoaAnhSanPhamQuanTri,
    onSuccess: function (duLieu, bienSo) {
      lamMoiDuLieuSanPham(boQuanLyTruyVan, bienSo.productId);
    },
  });
}
