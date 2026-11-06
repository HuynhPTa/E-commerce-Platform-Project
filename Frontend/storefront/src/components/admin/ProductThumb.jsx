import { useState } from "react";
import { ImageOff } from "lucide-react";
import { taoDuongDanTaiNguyen } from "../../lib/assetUrl";

// Thành phần này hiển thị ảnh đại diện nhỏ của sản phẩm trong khu vực quản trị.
export default function AnhSanPhamNho(thuocTinh) {
  const sanPham = thuocTinh.sanPham;

  // Trạng thái này cho biết ảnh sản phẩm đã bị lỗi tải hay chưa.
  const trangThaiLoiAnh = useState(false);

  // Biến này lưu trạng thái lỗi ảnh hiện tại.
  const coLoiAnh = trangThaiLoiAnh[0];

  // Biến này lưu hàm đánh dấu ảnh bị lỗi.
  const capNhatCoLoiAnh = trangThaiLoiAnh[1];

  // Hàm này đánh dấu ảnh sản phẩm đã bị lỗi tải.
  function xuLyLoiAnh() {
    capNhatCoLoiAnh(true);
  }

  // Biến này lưu đường dẫn đầy đủ của ảnh đại diện.
  const duongDanAnh = taoDuongDanTaiNguyen(sanPham.thumbnailUrl);

  // Phần tử này hiển thị biểu tượng thay thế khi không có ảnh dùng được.
  let phanTuAnh = (
    <span className="product-media__fallback">
      <ImageOff size={18} />
    </span>
  );

  if (duongDanAnh !== null) {
    if (coLoiAnh === false) {
      phanTuAnh = (
        <img
          src={duongDanAnh}
          alt=""
          loading="lazy"
          onError={xuLyLoiAnh}
        />
      );
    }
  }

  return <span className="table-product__media">{phanTuAnh}</span>;
}
