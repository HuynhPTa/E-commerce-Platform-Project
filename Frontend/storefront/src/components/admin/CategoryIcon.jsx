import { Tag } from "lucide-react";
import { BIEU_TUONG_DANH_MUC } from "./categoryIcons";

// Thành phần này hiển thị biểu tượng của một danh mục.
export default function BieuTuongDanhMuc(thuocTinh) {
  const tenBieuTuong = thuocTinh.name;

  // Biến này lưu thành phần biểu tượng cần hiển thị.
  let ThanhPhanBieuTuong = BIEU_TUONG_DANH_MUC[tenBieuTuong];

  if (ThanhPhanBieuTuong === undefined) {
    ThanhPhanBieuTuong = Tag;
  }

  // Biến này lưu kích thước biểu tượng, mặc định là 18.
  let kichThuoc = 18;

  if (thuocTinh.size !== undefined) {
    kichThuoc = thuocTinh.size;
  }

  return <ThanhPhanBieuTuong size={kichThuoc} />;
}
