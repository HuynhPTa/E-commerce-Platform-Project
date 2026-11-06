import {
  layLopTrangThaiDonHang,
  layNhanTrangThaiDonHang,
} from "../../lib/orderFormat";

// Thành phần này hiển thị trạng thái đơn hàng theo ngôn ngữ thiết kế cửa hàng.
export default function HuyHieuTrangThaiDonHang(thuocTinh) {
  const trangThai = thuocTinh.status;
  const lopCss = layLopTrangThaiDonHang(trangThai);
  const nhanTrangThai = layNhanTrangThaiDonHang(trangThai);

  return <span className={lopCss}>{nhanTrangThai}</span>;
}
