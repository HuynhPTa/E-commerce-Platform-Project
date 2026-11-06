import { useState } from "react";
import { ImageOff } from "lucide-react";
import { taoDuongDanTaiNguyen } from "../../lib/assetUrl.js";

// Hàm này đọc thứ tự của một ảnh, mặc định là 0 nếu ảnh không có thứ tự.
function layThuTuAnh(anhSanPham) {
  // Biến này lưu thứ tự hiển thị của ảnh.
  let thuTuAnh = 0;

  // Nếu ảnh có trường sortOrder thì dùng giá trị đó.
  if (anhSanPham.sortOrder !== undefined) {
    if (anhSanPham.sortOrder !== null) {
      thuTuAnh = anhSanPham.sortOrder;
    }
  }

  return thuTuAnh;
}

// Hàm này so sánh thứ tự của hai ảnh để sắp xếp ảnh tăng dần.
function soSanhThuTuAnh(anhThuNhat, anhThuHai) {
  const thuTuThuNhat = layThuTuAnh(anhThuNhat);
  const thuTuThuHai = layThuTuAnh(anhThuHai);

  return thuTuThuNhat - thuTuThuHai;
}

// Hàm này tạo danh sách đường dẫn ảnh của sản phẩm theo thứ tự hiển thị.
// Ảnh đại diện được đưa lên đầu, sau đó tới các ảnh chi tiết.
function taoDanhSachAnh(sanPham) {
  // Mảng này lưu các đường dẫn ảnh đã được kiểm tra trùng.
  const danhSachDuongDanAnh = [];

  // Biến này lưu danh sách ảnh gốc của sản phẩm.
  let danhSachAnhGoc = [];

  // Nếu sản phẩm có danh sách ảnh thì mới dùng được.
  if (Array.isArray(sanPham.images) === true) {
    danhSachAnhGoc = sanPham.images;
  }

  // Mảng này lưu bản sao của danh sách ảnh để sắp xếp mà không đổi dữ liệu gốc.
  const danhSachAnhDaSapXep = [];

  // Sao chép từng ảnh vào mảng mới.
  for (const anhSanPham of danhSachAnhGoc) {
    danhSachAnhDaSapXep.push(anhSanPham);
  }

  danhSachAnhDaSapXep.sort(soSanhThuTuAnh);

  // Thêm từng ảnh chi tiết vào danh sách đường dẫn.
  for (const anhSanPham of danhSachAnhDaSapXep) {
    const duongDanAnh = taoDuongDanTaiNguyen(anhSanPham.url);

    // Chỉ thêm ảnh khi có đường dẫn và ảnh chưa có trong danh sách.
    if (duongDanAnh !== null) {
      if (danhSachDuongDanAnh.includes(duongDanAnh) === false) {
        danhSachDuongDanAnh.push(duongDanAnh);
      }
    }
  }

  // Biến này lưu đường dẫn ảnh đại diện của sản phẩm.
  const duongDanAnhDaiDien = taoDuongDanTaiNguyen(sanPham.thumbnailUrl);

  // Ảnh đại diện được ưu tiên đứng đầu danh sách.
  if (duongDanAnhDaiDien !== null) {
    if (danhSachDuongDanAnh.includes(duongDanAnhDaiDien) === false) {
      danhSachDuongDanAnh.unshift(duongDanAnhDaiDien);
    }
  }

  // Nếu sản phẩm chưa có ảnh nào thì dùng ảnh của các phiên bản.
  if (danhSachDuongDanAnh.length === 0) {
    // Biến này lưu danh sách phiên bản của sản phẩm.
    let danhSachPhienBan = [];

    // Nếu sản phẩm có danh sách phiên bản thì mới dùng được.
    if (Array.isArray(sanPham.variants) === true) {
      danhSachPhienBan = sanPham.variants;
    }

    // Thêm ảnh của từng phiên bản nếu ảnh chưa có trong danh sách.
    for (const phienBan of danhSachPhienBan) {
      const duongDanAnhPhienBan = taoDuongDanTaiNguyen(phienBan.imageUrl);

      if (duongDanAnhPhienBan !== null) {
        if (danhSachDuongDanAnh.includes(duongDanAnhPhienBan) === false) {
          danhSachDuongDanAnh.push(duongDanAnhPhienBan);
        }
      }
    }
  }

  return danhSachDuongDanAnh;
}

// Thành phần này hiển thị thư viện ảnh của trang chi tiết sản phẩm.
export default function ThuVienAnhSanPham(thuocTinh) {
  // Biến này lưu dữ liệu sản phẩm do thành phần cha truyền xuống.
  const sanPham = thuocTinh.sanPham;

  // Biến này lưu danh sách ảnh của sản phẩm hiện tại.
  const danhSachAnh = taoDanhSachAnh(sanPham);

  // Trạng thái này lưu vị trí ảnh đang được chọn.
  const trangThaiChiSoAnh = useState(0);

  // Biến này lưu vị trí ảnh đang được chọn.
  const chiSoAnhDangChon = trangThaiChiSoAnh[0];

  // Biến này lưu hàm cập nhật vị trí ảnh đang chọn.
  const capNhatChiSoAnh = trangThaiChiSoAnh[1];

  // Trạng thái này cho biết ảnh chính có bị lỗi tải hay không.
  const trangThaiLoiAnh = useState(false);

  // Biến này cho biết ảnh chính đang bị lỗi hay không.
  const coLoiAnh = trangThaiLoiAnh[0];

  // Biến này lưu hàm cập nhật trạng thái lỗi ảnh.
  const capNhatCoLoiAnh = trangThaiLoiAnh[1];

  // Biến này cho biết sản phẩm có nhiều hơn một ảnh hay không.
  const coNhieuAnh = danhSachAnh.length > 1;

  // Biến này lưu đường dẫn ảnh đang hiển thị.
  let duongDanAnhDangChon = null;

  // Nếu có ảnh thì chọn ảnh theo vị trí hiện tại, nếu vị trí không hợp lệ thì lấy ảnh đầu.
  if (danhSachAnh.length > 0) {
    if (danhSachAnh[chiSoAnhDangChon] !== undefined) {
      duongDanAnhDangChon = danhSachAnh[chiSoAnhDangChon];
    } else {
      duongDanAnhDangChon = danhSachAnh[0];
    }
  }

  // Biến này lưu tên lớp của khung thư viện ảnh.
  let tenLopThuVienAnh = "gallery";

  // Nếu chỉ có một ảnh thì thêm lớp hiển thị riêng.
  if (coNhieuAnh === false) {
    tenLopThuVienAnh = "gallery gallery--single";
  }

  // Hàm này chọn một ảnh và xoá trạng thái lỗi ảnh.
  function xuLyChonAnh(chiSoAnhMoi) {
    capNhatChiSoAnh(chiSoAnhMoi);
    capNhatCoLoiAnh(false);
  }

  // Hàm này đánh dấu ảnh chính đã bị lỗi tải.
  function xuLyLoiAnhChinh() {
    capNhatCoLoiAnh(true);
  }

  // Phần tử này hiển thị danh sách ảnh thu nhỏ khi có nhiều ảnh.
  let phanTuAnhThuNho = null;

  if (coNhieuAnh === true) {
    // Mảng này lưu các nút ảnh thu nhỏ.
    const cacNutAnhThuNho = [];

    // Biến này lưu vị trí ảnh đang xét.
    let chiSoAnh = 0;

    // Tạo nút cho từng ảnh trong danh sách.
    while (chiSoAnh < danhSachAnh.length) {
      const duongDanAnh = danhSachAnh[chiSoAnh];

      // Biến này giữ giá trị chỉ số của vòng lặp hiện tại để hàm xử lý dùng đúng ảnh.
      const chiSoAnhHienTai = chiSoAnh;

      // Hàm này chọn ảnh tại vị trí hiện tại.
      function xuLyChonAnhThuNho() {
        xuLyChonAnh(chiSoAnhHienTai);
      }

      // aria-current cho trình đọc màn hình biết ảnh đang được chọn.
      let giaTriHienTai = undefined;
      if (chiSoAnhHienTai === chiSoAnhDangChon) {
        giaTriHienTai = "true";
      }

      // Biến này cho biết ảnh thu nhỏ có đang được chọn hay không.
      let dangDuocChon = false;
      if (chiSoAnhHienTai === chiSoAnhDangChon) {
        dangDuocChon = true;
      }

      const khoaAnh = duongDanAnh + "-" + chiSoAnhHienTai;
      const moTaAnh = sanPham.name + ", ảnh " + (chiSoAnhHienTai + 1);

      cacNutAnhThuNho.push(
        <button
          key={khoaAnh}
          className="gallery__thumb"
          type="button"
          role="tab"
          aria-current={giaTriHienTai}
          aria-selected={dangDuocChon}
          onClick={xuLyChonAnhThuNho}
        >
          <img src={duongDanAnh} alt={moTaAnh} />
        </button>,
      );

      chiSoAnh += 1;
    }

    phanTuAnhThuNho = (
      <div
        className="gallery__thumbs"
        role="tablist"
        aria-label="Ảnh sản phẩm"
      >
        {cacNutAnhThuNho}
      </div>
    );
  }

  // Phần tử này hiển thị ảnh chính hoặc biểu tượng thay thế.
  let phanTuAnhChinh = null;

  if (duongDanAnhDangChon !== null) {
    if (coLoiAnh === false) {
      phanTuAnhChinh = (
        <img
          src={duongDanAnhDangChon}
          alt={sanPham.name}
          onError={xuLyLoiAnhChinh}
        />
      );
    }
  }

  // Nếu ảnh chính không dùng được thì hiển thị biểu tượng thay thế.
  if (phanTuAnhChinh === null) {
    phanTuAnhChinh = (
      <span className="product-media__fallback">
        <ImageOff size={48} />
      </span>
    );
  }

  return (
    <div className={tenLopThuVienAnh}>
      {phanTuAnhThuNho}
      <div className="gallery__main">{phanTuAnhChinh}</div>
    </div>
  );
}
