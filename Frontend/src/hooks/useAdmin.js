import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  capNhatNguoiDungQuanTri,
  capNhatTrangThaiDonHangQuanTri,
  capNhatTrangThaiNguoiDungQuanTri,
  layChiTietDonHangQuanTri,
  layChiTietNguoiDungQuanTri,
  layDanhSachDonHangQuanTri,
  layDanhSachNguoiDungQuanTri,
  layThongKeDonHangQuanTri,
  layThongKeNguoiDungQuanTri,
  layTongQuanQuanTri,
  taoNguoiDungQuanTri,
  xoaNguoiDungQuanTri,
} from "../api/adminApi";

// Các khoá này giúp làm mới đúng nhóm dữ liệu sau khi có thay đổi.
export const KHOA_TONG_QUAN_QUAN_TRI = ["admin", "dashboard"];
export const KHOA_DON_HANG_QUAN_TRI = ["admin", "orders"];
export const KHOA_NGUOI_DUNG_QUAN_TRI = ["admin", "users"];

// Hook này lấy số liệu tổng quan của cửa hàng.
export function useTongQuanQuanTri() {
  return useQuery({
    queryKey: KHOA_TONG_QUAN_QUAN_TRI,
    queryFn: layTongQuanQuanTri,
    staleTime: 30 * 1000,
  });
}

// Hook này lấy số liệu thống kê của module đơn hàng.
export function useThongKeDonHangQuanTri() {
  return useQuery({
    queryKey: ["admin", "orders", "stats"],
    queryFn: layThongKeDonHangQuanTri,
    staleTime: 20 * 1000,
  });
}

// Hook này lấy danh sách đơn hàng theo bộ lọc hiện tại.
export function useDanhSachDonHangQuanTri(thamSo) {
  return useQuery({
    queryKey: ["admin", "orders", "list", thamSo],
    queryFn: function () {
      return layDanhSachDonHangQuanTri(thamSo);
    },
    staleTime: 20 * 1000,
  });
}

// Hook này lấy chi tiết một đơn hàng khi người dùng mở hộp thoại.
export function useChiTietDonHangQuanTri(maDonHang) {
  let choPhepGoi = false;

  if (maDonHang !== null) {
    if (maDonHang !== undefined) {
      choPhepGoi = true;
    }
  }

  return useQuery({
    queryKey: ["admin", "orders", "detail", String(maDonHang)],
    queryFn: function () {
      return layChiTietDonHangQuanTri(maDonHang);
    },
    enabled: choPhepGoi,
  });
}

// Hook này cập nhật trạng thái đơn hàng và làm mới dữ liệu liên quan.
export function useCapNhatTrangThaiDonHangQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: capNhatTrangThaiDonHangQuanTri,
    onSuccess: function () {
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_DON_HANG_QUAN_TRI });
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_TONG_QUAN_QUAN_TRI });
    },
  });
}

// Hook này lấy số liệu thống kê của module người dùng.
export function useThongKeNguoiDungQuanTri() {
  return useQuery({
    queryKey: ["admin", "users", "stats"],
    queryFn: layThongKeNguoiDungQuanTri,
    staleTime: 20 * 1000,
  });
}

// Hook này lấy danh sách người dùng theo bộ lọc hiện tại.
export function useDanhSachNguoiDungQuanTri(thamSo) {
  return useQuery({
    queryKey: ["admin", "users", "list", thamSo],
    queryFn: function () {
      return layDanhSachNguoiDungQuanTri(thamSo);
    },
    staleTime: 20 * 1000,
  });
}

// Hook này khoá hoặc mở khoá tài khoản người dùng.
export function useCapNhatTrangThaiNguoiDungQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: capNhatTrangThaiNguoiDungQuanTri,
    onSuccess: function () {
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_NGUOI_DUNG_QUAN_TRI });
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_TONG_QUAN_QUAN_TRI });
    },
  });
}

// Hook này lấy chi tiết một tài khoản khi quản trị viên mở hộp thoại.
export function useChiTietNguoiDungQuanTri(maNguoiDung) {
  let choPhepGoi = false;

  if (maNguoiDung !== null) {
    if (maNguoiDung !== undefined) {
      choPhepGoi = true;
    }
  }

  return useQuery({
    queryKey: ["admin", "users", "detail", String(maNguoiDung)],
    queryFn: function () {
      return layChiTietNguoiDungQuanTri(maNguoiDung);
    },
    enabled: choPhepGoi,
  });
}

// Hook này tạo tài khoản người dùng mới.
export function useTaoNguoiDungQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: taoNguoiDungQuanTri,
    onSuccess: function () {
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_NGUOI_DUNG_QUAN_TRI });
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_TONG_QUAN_QUAN_TRI });
    },
  });
}

// Hook này cập nhật thông tin tài khoản người dùng.
export function useCapNhatNguoiDungQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: capNhatNguoiDungQuanTri,
    onSuccess: function () {
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_NGUOI_DUNG_QUAN_TRI });
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_TONG_QUAN_QUAN_TRI });
    },
  });
}

// Hook này xoá mềm tài khoản người dùng.
export function useXoaNguoiDungQuanTri() {
  const boQuanLyTruyVan = useQueryClient();

  return useMutation({
    mutationFn: xoaNguoiDungQuanTri,
    onSuccess: function () {
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_NGUOI_DUNG_QUAN_TRI });
      boQuanLyTruyVan.invalidateQueries({ queryKey: KHOA_TONG_QUAN_QUAN_TRI });
    },
  });
}
