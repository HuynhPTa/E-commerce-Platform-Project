import { useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff, Plus } from "lucide-react";
import { taoDuongDanTaiNguyen } from "../../lib/assetUrl.js";
import { dinhDangTien } from "../../lib/formatMoney.js";
import HienThiSaoDanhGia from "./RatingStars.jsx";

// Thành phần này hiển thị một thẻ sản phẩm trong lưới sản phẩm.
export default function TheSanPham(thuocTinh) {
  // Biến này lưu dữ liệu sản phẩm do thành phần cha truyền xuống.
  const sanPham = thuocTinh.sanPham;

  // useState tạo trạng thái cho biết ảnh sản phẩm có bị lỗi tải hay không.
  const trangThaiLoiAnh = useState(false);

  // Biến này cho biết ảnh sản phẩm đang bị lỗi hay không.
  const coLoiAnh = trangThaiLoiAnh[0];

  // Biến này lưu hàm cập nhật trạng thái lỗi ảnh.
  const capNhatCoLoiAnh = trangThaiLoiAnh[1];

  // Biến này lưu đường dẫn đầy đủ của ảnh đại diện sản phẩm.
  const duongDanAnhSanPham = taoDuongDanTaiNguyen(sanPham.thumbnailUrl);

  // Biến này lưu danh sách phiên bản của sản phẩm.
  let danhSachPhienBan = [];

  // Nếu sản phẩm có danh sách phiên bản thì mới dùng được.
  if (Array.isArray(sanPham.variants) === true) {
    danhSachPhienBan = sanPham.variants;
  }

  // Biến này lưu giá thấp nhất trong các phiên bản.
  let giaThapNhat = 0;

  // Nếu có phiên bản thì tìm giá nhỏ nhất bằng vòng lặp.
  if (danhSachPhienBan.length > 0) {
    giaThapNhat = Number(danhSachPhienBan[0].priceMinor);

    // Biến này lưu vị trí của phiên bản đang xét.
    let chiSoPhienBan = 1;

    while (chiSoPhienBan < danhSachPhienBan.length) {
      const giaPhienBan = Number(danhSachPhienBan[chiSoPhienBan].priceMinor);

      if (giaPhienBan < giaThapNhat) {
        giaThapNhat = giaPhienBan;
      }

      chiSoPhienBan += 1;
    }
  }

  // Biến này lưu đường dẫn tới trang chi tiết sản phẩm.
  const duongDanChiTietSanPham = "/products/" + sanPham.id;

  // Biến này lưu nội dung điểm đánh giá hiển thị trên thẻ.
  let noiDungDanhGia = "Chưa có đánh giá";

  // Nếu sản phẩm đã có đánh giá thì hiển thị điểm trung bình và số lượt.
  if (sanPham.ratingCount > 0) {
    const diemTrungBinh = Number(sanPham.ratingAvg);
    const diemDaRutGon = diemTrungBinh.toFixed(1);
    noiDungDanhGia = diemDaRutGon + " (" + sanPham.ratingCount + ")";
  }

  // Hàm này đánh dấu ảnh sản phẩm đã bị lỗi tải.
  function xuLyLoiAnh() {
    capNhatCoLoiAnh(true);
  }

  // Hàm này gửi sản phẩm lên thành phần cha để thêm nhanh vào giỏ.
  function xuLyThemNhanh() {
    thuocTinh.khiThemNhanh(sanPham);
  }

  // Phần tử này hiển thị ảnh sản phẩm hoặc biểu tượng thay thế.
  let phanTuAnhSanPham = null;

  // Chỉ hiển thị ảnh khi có đường dẫn và ảnh chưa bị lỗi.
  if (duongDanAnhSanPham !== null) {
    if (coLoiAnh === false) {
      phanTuAnhSanPham = (
        <img
          src={duongDanAnhSanPham}
          alt={sanPham.name}
          loading="lazy"
          onError={xuLyLoiAnh}
        />
      );
    }
  }

  // Nếu không có ảnh dùng được thì hiển thị biểu tượng thay thế.
  if (phanTuAnhSanPham === null) {
    phanTuAnhSanPham = (
      <span className="product-media__fallback">
        <ImageOff size={32} />
      </span>
    );
  }

  // Biến này lưu nhãn truy cập cho nút thêm nhanh.
  const nhanNutThemNhanh = "Thêm " + sanPham.name + " vào giỏ";

  return (
    <article className="product-card">
      <div className="product-media">
        <Link to={duongDanChiTietSanPham} aria-label={sanPham.name}>
          {phanTuAnhSanPham}
        </Link>

        <button
          className="quick-add"
          type="button"
          onClick={xuLyThemNhanh}
          aria-label={nhanNutThemNhanh}
          title="Thêm nhanh vào giỏ hàng"
        >
          <Plus className="icon" />
        </button>
      </div>

      <div className="product-info">
        <Link className="product-name" to={duongDanChiTietSanPham}>
          {sanPham.name}
        </Link>
        <div className="product-price">{dinhDangTien(giaThapNhat)}</div>
        <div className="product-rating">
          <HienThiSaoDanhGia rating={sanPham.ratingAvg} />
          <span>{noiDungDanhGia}</span>
        </div>
      </div>
    </article>
  );
}
