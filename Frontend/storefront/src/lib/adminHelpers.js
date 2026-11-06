import { dinhDangTien } from "./formatMoney";

// Tệp này chứa các hàm dùng chung cho khu vực quản trị.
// Các hàm ở đây không gọi React và không gọi API.

// Hàm này bóc lớp result trong phản hồi của backend nếu có.
export function bocDuLieuPhanHoi(duLieu) {
  if (duLieu === null) {
    return null;
  }

  if (duLieu === undefined) {
    return null;
  }

  if (duLieu.result !== undefined) {
    if (duLieu.result !== null) {
      return duLieu.result;
    }
  }

  return duLieu;
}

// Hàm này lấy thông điệp lỗi tiếng Việt từ phản hồi lỗi của backend.
export function layThongBaoLoi(loi, thongDiepMacDinh) {
  // Biến này lưu thông điệp mặc định khi không đọc được lỗi cụ thể.
  let thongDiep = "Thao tác thất bại, vui lòng thử lại";

  if (thongDiepMacDinh !== undefined) {
    if (thongDiepMacDinh !== "") {
      thongDiep = thongDiepMacDinh;
    }
  }

  if (loi === null) {
    return "";
  }

  if (loi === undefined) {
    return "";
  }

  // Biến này lưu phần phản hồi HTTP của lỗi.
  const phanHoi = loi.response;

  if (phanHoi === undefined) {
    return "Không kết nối được máy chủ";
  }

  if (phanHoi === null) {
    return "Không kết nối được máy chủ";
  }

  if (phanHoi.status === 403) {
    return "Bạn không có quyền thực hiện thao tác này";
  }

  // Biến này lưu dữ liệu lỗi do backend trả về.
  const duLieuLoi = phanHoi.data;

  if (duLieuLoi !== undefined) {
    if (duLieuLoi !== null) {
      if (typeof duLieuLoi.message === "string") {
        if (duLieuLoi.message !== "") {
          return duLieuLoi.message;
        }
      }
    }
  }

  return thongDiep;
}

// Hàm này thêm số 0 phía trước khi giá trị nhỏ hơn 10.
function themSoKhong(giaTri) {
  if (giaTri < 10) {
    return "0" + giaTri;
  }

  return "" + giaTri;
}

// Hàm này định dạng một thời điểm thành ngày đầy đủ theo cách viết Việt Nam.
export function dinhDangNgayDayDu(thoiDiem) {
  if (thoiDiem === null) {
    return "—";
  }

  if (thoiDiem === undefined) {
    return "—";
  }

  if (thoiDiem === "") {
    return "—";
  }

  // Biến này lưu đối tượng ngày được tạo từ dữ liệu backend.
  const ngayCanDinhDang = new Date(thoiDiem);

  if (Number.isNaN(ngayCanDinhDang.getTime()) === true) {
    return "—";
  }

  const ngayTrongThang = themSoKhong(ngayCanDinhDang.getDate());
  const thangTrongNam = themSoKhong(ngayCanDinhDang.getMonth() + 1);
  const nam = ngayCanDinhDang.getFullYear();

  return ngayTrongThang + "/" + thangTrongNam + "/" + nam;
}

// Hàm này trả về số liệu an toàn để hiển thị khi dữ liệu chưa tải xong.
export function laySoLieuQuanTri(giaTri) {
  if (giaTri === null) {
    return "—";
  }

  if (giaTri === undefined) {
    return "—";
  }

  return giaTri;
}

// Hàm này định dạng một tỷ lệ phần trăm theo cách viết Việt Nam.
export function dinhDangPhanTramQuanTri(giaTri) {
  if (giaTri === null) {
    return "—";
  }

  if (giaTri === undefined) {
    return "—";
  }

  const soDaChuyen = Number(giaTri);

  if (Number.isFinite(soDaChuyen) === false) {
    return "—";
  }

  return soDaChuyen.toLocaleString("vi-VN") + "%";
}

// Hàm này lấy tên hiển thị của một người dùng.
export function layTenHienThi(nguoiDung) {
  if (nguoiDung === null) {
    return "";
  }

  if (nguoiDung === undefined) {
    return "";
  }

  if (typeof nguoiDung.fullName === "string") {
    if (nguoiDung.fullName.trim() !== "") {
      return nguoiDung.fullName;
    }
  }

  // Biến này lưu tên ghép từ họ và tên.
  let tenDayDu = "";

  if (typeof nguoiDung.firstName === "string") {
    tenDayDu = nguoiDung.firstName;
  }

  if (typeof nguoiDung.lastName === "string") {
    if (tenDayDu !== "") {
      tenDayDu = tenDayDu + " " + nguoiDung.lastName;
    } else {
      tenDayDu = nguoiDung.lastName;
    }
  }

  if (tenDayDu.trim() !== "") {
    return tenDayDu;
  }

  if (typeof nguoiDung.email === "string") {
    return nguoiDung.email;
  }

  return "";
}

// Hàm này tạo chữ viết tắt cho ảnh đại diện.
export function layChuVietTat(nguoiDung) {
  const tenHienThi = layTenHienThi(nguoiDung);

  if (tenHienThi === "") {
    return "?";
  }

  // Biến này lưu tên hiển thị sau khi bỏ khoảng trắng thừa.
  const tenDaCat = tenHienThi.trim();

  // Biến này lưu các từ trong tên hiển thị.
  const cacTu = tenDaCat.split(/\s+/);

  if (cacTu.length === 0) {
    return "?";
  }

  if (cacTu.length === 1) {
    const chuDauTien = cacTu[0].charAt(0);
    return chuDauTien.toUpperCase();
  }

  const tuApChot = cacTu[cacTu.length - 2];
  const tuCuoi = cacTu[cacTu.length - 1];
  const chuDauApChot = tuApChot.charAt(0);
  const chuDauCuoi = tuCuoi.charAt(0);
  const chuVietTat = chuDauApChot + chuDauCuoi;

  return chuVietTat.toUpperCase();
}

// Hàm này chuyển tên danh mục thành slug chỉ gồm chữ thường không dấu.
export function taoSlugTuTen(ten) {
  if (typeof ten !== "string") {
    return "";
  }

  let ketQua = ten.toLowerCase();
  ketQua = ketQua.replace(/đ/g, "d");
  ketQua = ketQua.normalize("NFD");
  ketQua = ketQua.replace(/\p{M}+/gu, "");
  ketQua = ketQua.replace(/[^a-z0-9]+/g, "-");
  ketQua = ketQua.replace(/^-+|-+$/g, "");

  return ketQua;
}

// Hàm này tìm tập id của một danh mục và toàn bộ danh mục con cháu.
export function timIdDanhMucCon(danhSachPhang, idGoc) {
  // Biến này lưu tập id cần loại khỏi ô chọn danh mục cha.
  const tapId = new Set();
  tapId.add(idGoc);

  let conThayDoi = true;

  while (conThayDoi === true) {
    conThayDoi = false;

    for (const danhMuc of danhSachPhang) {
      if (danhMuc.parentId === null) {
        continue;
      }

      if (danhMuc.parentId === undefined) {
        continue;
      }

      if (tapId.has(danhMuc.parentId) === false) {
        continue;
      }

      if (tapId.has(danhMuc.id) === true) {
        continue;
      }

      tapId.add(danhMuc.id);
      conThayDoi = true;
    }
  }

  return tapId;
}

// Hàm này chuyển danh sách dòng thuộc tính thành một đối tượng.
export function taoDoiTuongThuocTinh(danhSachDong) {
  const ketQua = {};

  if (danhSachDong === null) {
    return ketQua;
  }

  if (danhSachDong === undefined) {
    return ketQua;
  }

  for (const dong of danhSachDong) {
    const tenThuocTinh = dong.key.trim();
    const giaTriThuocTinh = dong.value.trim();

    if (tenThuocTinh === "") {
      continue;
    }

    ketQua[tenThuocTinh] = giaTriThuocTinh;
  }

  return ketQua;
}

// Hàm này chuyển đối tượng thuộc tính thành danh sách dòng cho biểu mẫu.
export function taoDongThuocTinh(thuocTinh) {
  const danhSachDong = [];

  if (thuocTinh === null) {
    danhSachDong.push({ key: "", value: "" });
    return danhSachDong;
  }

  if (thuocTinh === undefined) {
    danhSachDong.push({ key: "", value: "" });
    return danhSachDong;
  }

  const cacCapThuocTinh = Object.entries(thuocTinh);

  if (cacCapThuocTinh.length === 0) {
    danhSachDong.push({ key: "", value: "" });
    return danhSachDong;
  }

  for (const capThuocTinh of cacCapThuocTinh) {
    const dong = {
      key: capThuocTinh[0],
      value: capThuocTinh[1],
    };
    danhSachDong.push(dong);
  }

  return danhSachDong;
}

// Hàm này trả về khoảng giá bán của một sản phẩm dựa trên các biến thể.
export function layKhoangGiaSanPham(sanPham) {
  if (sanPham === null) {
    return "—";
  }

  if (sanPham === undefined) {
    return "—";
  }

  if (Array.isArray(sanPham.variants) === false) {
    return "—";
  }

  if (sanPham.variants.length === 0) {
    return "—";
  }

  let giaNhoNhat = null;
  let giaLonNhat = null;

  for (const phienBan of sanPham.variants) {
    const giaPhienBan = Number(phienBan.priceMinor);

    if (Number.isFinite(giaPhienBan) === false) {
      continue;
    }

    if (giaNhoNhat === null) {
      giaNhoNhat = giaPhienBan;
    }

    if (giaLonNhat === null) {
      giaLonNhat = giaPhienBan;
    }

    if (giaPhienBan < giaNhoNhat) {
      giaNhoNhat = giaPhienBan;
    }

    if (giaPhienBan > giaLonNhat) {
      giaLonNhat = giaPhienBan;
    }
  }

  if (giaNhoNhat === null) {
    return "—";
  }

  if (giaNhoNhat === giaLonNhat) {
    return dinhDangTien(giaNhoNhat);
  }

  return dinhDangTien(giaNhoNhat) + " – " + dinhDangTien(giaLonNhat);
}

// Hàm này tính tổng tồn kho của tất cả biến thể trong một sản phẩm.
export function tinhTongTonKho(sanPham) {
  if (sanPham === null) {
    return 0;
  }

  if (sanPham === undefined) {
    return 0;
  }

  if (Array.isArray(sanPham.variants) === false) {
    return 0;
  }

  let tongTonKho = 0;

  for (const phienBan of sanPham.variants) {
    const soLuong = Number(phienBan.stockQuantity);

    if (Number.isFinite(soLuong) === true) {
      tongTonKho = tongTonKho + soLuong;
    }
  }

  return tongTonKho;
}

// Hàm này đếm số phần tử của một mảng và trả về 0 nếu dữ liệu không hợp lệ.
export function demPhanTuMang(mang) {
  if (Array.isArray(mang) === false) {
    return 0;
  }

  return mang.length;
}

// Hàm này nối các thuộc tính của một biến thể thành chuỗi dễ đọc.
export function taoChuoiThuocTinhPhienBan(thuocTinh) {
  if (thuocTinh === null) {
    return "";
  }

  if (thuocTinh === undefined) {
    return "";
  }

  const cacCapThuocTinh = Object.entries(thuocTinh);
  const cacPhan = [];

  for (const capThuocTinh of cacCapThuocTinh) {
    const chuoiMotCap = capThuocTinh[0] + ": " + capThuocTinh[1];
    cacPhan.push(chuoiMotCap);
  }

  return cacPhan.join(", ");
}
