import { boGoiApi } from "./apiClient";
import { bocDuLieuPhanHoi } from "../lib/adminHelpers";

// Tệp này gọi các API quản trị sản phẩm cho website single-brand.

// Hàm này lấy số liệu thống kê của module sản phẩm.
export async function layThongKeSanPhamQuanTri() {
  const phanHoi = await boGoiApi.get("/admin/products/stats");

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy danh sách sản phẩm có phân trang và bộ lọc.
export async function layDanhSachSanPhamQuanTri(thamSo) {
  const phanHoi = await boGoiApi.get("/admin/products", { params: thamSo });

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy chi tiết một sản phẩm.
export async function layChiTietSanPhamQuanTri(maSanPham) {
  const duongDan = "/admin/products/" + maSanPham;
  const phanHoi = await boGoiApi.get(duongDan);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này tạo một sản phẩm mới.
export async function taoSanPhamQuanTri(duLieuSanPham) {
  const phanHoi = await boGoiApi.post("/admin/products", duLieuSanPham);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này cập nhật thông tin chung của một sản phẩm.
export async function capNhatSanPhamQuanTri(duLieuCapNhat) {
  const maSanPham = duLieuCapNhat.productId;
  const duongDan = "/admin/products/" + maSanPham;
  const duLieuGui = {
    name: duLieuCapNhat.name,
    description: duLieuCapNhat.description,
    categoryId: duLieuCapNhat.categoryId,
  };
  const phanHoi = await boGoiApi.put(duongDan, duLieuGui);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này xoá mềm một sản phẩm.
export async function xoaSanPhamQuanTri(maSanPham) {
  const duongDan = "/admin/products/" + maSanPham;
  await boGoiApi.delete(duongDan);

  return maSanPham;
}

// Hàm này thêm một biến thể cho sản phẩm.
export async function taoPhienBanQuanTri(duLieuPhienBan) {
  const maSanPham = duLieuPhienBan.productId;
  const duongDan = "/admin/products/" + maSanPham + "/variants";
  const duLieuGui = {
    sku: duLieuPhienBan.sku,
    attributes: duLieuPhienBan.attributes,
    priceMinor: duLieuPhienBan.priceMinor,
    stockQuantity: duLieuPhienBan.stockQuantity,
    imageUrl: duLieuPhienBan.imageUrl,
  };
  const phanHoi = await boGoiApi.post(duongDan, duLieuGui);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này cập nhật toàn bộ thông tin của một biến thể.
export async function capNhatPhienBanQuanTri(duLieuCapNhat) {
  const maSanPham = duLieuCapNhat.productId;
  const maPhienBan = duLieuCapNhat.variantId;
  const duongDan =
    "/admin/products/" +
    maSanPham +
    "/variants/" +
    maPhienBan;
  const duLieuGui = {
    sku: duLieuCapNhat.sku,
    attributes: duLieuCapNhat.attributes,
    priceMinor: duLieuCapNhat.priceMinor,
    stockQuantity: duLieuCapNhat.stockQuantity,
    imageUrl: duLieuCapNhat.imageUrl,
  };
  const phanHoi = await boGoiApi.put(duongDan, duLieuGui);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này xoá một biến thể khỏi sản phẩm.
export async function xoaPhienBanQuanTri(duLieuXoa) {
  const maSanPham = duLieuXoa.productId;
  const maPhienBan = duLieuXoa.variantId;
  const duongDan =
    "/admin/products/" +
    maSanPham +
    "/variants/" +
    maPhienBan;
  await boGoiApi.delete(duongDan);

  return maPhienBan;
}

// Hàm này tải một ảnh lên sản phẩm.
export async function taiAnhSanPhamQuanTri(duLieuTaiAnh) {
  const maSanPham = duLieuTaiAnh.productId;
  const tepAnh = duLieuTaiAnh.file;
  const duongDan = "/admin/products/" + maSanPham + "/images";
  const duLieuGui = new FormData();
  duLieuGui.append("file", tepAnh);
  const phanHoi = await boGoiApi.post(duongDan, duLieuGui);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này xoá một ảnh khỏi sản phẩm.
export async function xoaAnhSanPhamQuanTri(duLieuXoa) {
  const maSanPham = duLieuXoa.productId;
  const maAnh = duLieuXoa.imageId;
  const duongDan =
    "/admin/products/" +
    maSanPham +
    "/images/" +
    maAnh;
  await boGoiApi.delete(duongDan);

  return maAnh;
}
