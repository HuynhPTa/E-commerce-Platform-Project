import { boGoiApi } from "./apiClient";
import { bocDuLieuPhanHoi } from "../lib/adminHelpers";

// Tệp này gọi các API quản trị tổng quan, đơn hàng và người dùng.

// Hàm này lấy số liệu tổng quan của cửa hàng.
export async function layTongQuanQuanTri() {
  const phanHoi = await boGoiApi.get("/admin/dashboard");

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy số liệu thống kê của module đơn hàng.
export async function layThongKeDonHangQuanTri() {
  const phanHoi = await boGoiApi.get("/admin/orders/stats");

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy danh sách đơn hàng có phân trang và bộ lọc.
export async function layDanhSachDonHangQuanTri(thamSo) {
  const phanHoi = await boGoiApi.get("/admin/orders", { params: thamSo });

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy chi tiết một đơn hàng.
export async function layChiTietDonHangQuanTri(maDonHang) {
  const duongDan = "/admin/orders/" + maDonHang;
  const phanHoi = await boGoiApi.get(duongDan);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này cập nhật trạng thái của một đơn hàng.
export async function capNhatTrangThaiDonHangQuanTri(duLieuCapNhat) {
  const maDonHang = duLieuCapNhat.orderId;
  const trangThai = duLieuCapNhat.status;
  const duongDan = "/admin/orders/" + maDonHang + "/status";
  const duLieuGui = { status: trangThai };
  const phanHoi = await boGoiApi.patch(duongDan, duLieuGui);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy số liệu thống kê của module người dùng.
export async function layThongKeNguoiDungQuanTri() {
  const phanHoi = await boGoiApi.get("/admin/users/stats");

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy danh sách người dùng có phân trang và bộ lọc.
export async function layDanhSachNguoiDungQuanTri(thamSo) {
  const phanHoi = await boGoiApi.get("/admin/users", { params: thamSo });

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này khoá hoặc mở khoá một tài khoản người dùng.
export async function capNhatTrangThaiNguoiDungQuanTri(duLieuCapNhat) {
  const maNguoiDung = duLieuCapNhat.id;
  const trangThai = duLieuCapNhat.status;
  const duongDan = "/admin/users/" + maNguoiDung + "/status";
  const duLieuGui = { status: trangThai };
  const phanHoi = await boGoiApi.patch(duongDan, duLieuGui);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy chi tiết một tài khoản người dùng.
export async function layChiTietNguoiDungQuanTri(maNguoiDung) {
  const duongDan = "/admin/users/" + maNguoiDung;
  const phanHoi = await boGoiApi.get(duongDan);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này tạo một tài khoản người dùng mới.
export async function taoNguoiDungQuanTri(duLieuTao) {
  const phanHoi = await boGoiApi.post("/admin/users", duLieuTao);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này cập nhật thông tin một tài khoản người dùng.
export async function capNhatNguoiDungQuanTri(duLieuCapNhat) {
  const maNguoiDung = duLieuCapNhat.id;
  const duongDan = "/admin/users/" + maNguoiDung;
  const phanHoi = await boGoiApi.put(duongDan, duLieuCapNhat.duLieu);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này xoá mềm một tài khoản người dùng.
export async function xoaNguoiDungQuanTri(maNguoiDung) {
  const duongDan = "/admin/users/" + maNguoiDung;
  await boGoiApi.delete(duongDan);
}
