import { boGoiApi } from "./apiClient";
import { bocDuLieuPhanHoi } from "../lib/adminHelpers";

// Tệp này gọi các API quản trị danh mục.

// Hàm này lấy số liệu thống kê của module danh mục.
export async function layThongKeDanhMucQuanTri() {
  const phanHoi = await boGoiApi.get("/categories/stats");

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này lấy danh sách danh mục phẳng theo thứ tự cây.
export async function layDanhSachDanhMucPhang() {
  const phanHoi = await boGoiApi.get("/categories/flat");

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này tạo một danh mục mới.
export async function taoDanhMucQuanTri(duLieuDanhMuc) {
  const duLieuGui = {
    name: duLieuDanhMuc.name,
    slug: duLieuDanhMuc.slug,
    parentId: duLieuDanhMuc.parentId,
    icon: duLieuDanhMuc.icon,
    sortOrder: duLieuDanhMuc.sortOrder,
  };
  const phanHoi = await boGoiApi.post("/categories", duLieuGui);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này cập nhật một danh mục đã có.
export async function capNhatDanhMucQuanTri(duLieuCapNhat) {
  const maDanhMuc = duLieuCapNhat.id;
  const duongDan = "/categories/" + maDanhMuc;
  const duLieuGui = {
    name: duLieuCapNhat.name,
    slug: duLieuCapNhat.slug,
    parentId: duLieuCapNhat.parentId,
    icon: duLieuCapNhat.icon,
    sortOrder: duLieuCapNhat.sortOrder,
  };
  const phanHoi = await boGoiApi.put(duongDan, duLieuGui);

  return bocDuLieuPhanHoi(phanHoi.data);
}

// Hàm này xoá một danh mục.
export async function xoaDanhMucQuanTri(maDanhMuc) {
  const duongDan = "/categories/" + maDanhMuc;
  await boGoiApi.delete(duongDan);

  return maDanhMuc;
}
