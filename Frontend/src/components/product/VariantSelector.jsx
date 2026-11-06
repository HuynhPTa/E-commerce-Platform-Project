// Bảng này dịch tên thuộc tính kỹ thuật sang nhãn tiếng Việt.
// Các khóa bên trái phải giữ nguyên vì chúng là tên thuộc tính do backend trả về.
const NHAN_THUOC_TINH = {
  color: "Màu",
  size: "Kích cỡ",
  "loại": "Loại",
  layout: "Bố cục",
  set: "Bộ",
  switch: "Kiểu switch",
};

// Bảng này ánh xạ tên màu sang mã màu dùng cho chấm màu của phiên bản.
const MAU_SAC_THEO_TEN = {
  "đen": "#111111",
  "trắng": "#ffffff",
  "đỏ": "#c62828",
  "hồng": "#e91e63",
  "cam": "#ef6c00",
  "vàng": "#f4b400",
  "xanh": "#1565c0",
  "xanh dương": "#1565c0",
  "xanh biển": "#0288d1",
  "xanh lá": "#2e7d32",
  "xanh navy": "#1a237e",
  "tím": "#6a1b9a",
  "nâu": "#795548",
  "xám": "#9e9e9e",
  "ghi": "#9e9e9e",
  "be": "#d8c3a5",
  "kem": "#f3e5ab",
  "bạc": "#c0c0c0",
  "vàng đồng": "#b8860b",
};

// Biến này lưu đối tượng rỗng dùng khi phiên bản không có thuộc tính.
const THUOC_TINH_RONG = {};

// Hàm này trả về nhãn tiếng Việt của một tên thuộc tính.
function layNhanThuocTinh(tenThuocTinh) {
  // Biến này lưu nhãn đã biết trong bảng dịch.
  const nhanDaBiet = NHAN_THUOC_TINH[tenThuocTinh];

  // Nếu đã có nhãn thì trả về luôn.
  if (nhanDaBiet !== undefined) {
    return nhanDaBiet;
  }

  // Nếu chưa có thì viết hoa ký tự đầu của tên thuộc tính.
  const chuDau = tenThuocTinh.charAt(0);
  const chuDauVietHoa = chuDau.toUpperCase();
  const phanConLai = tenThuocTinh.slice(1);

  return chuDauVietHoa + phanConLai;
}

// Hàm này trả về mã màu tương ứng với tên màu của phiên bản.
function layMauSac(tenMau) {
  // Nếu tên màu không phải chuỗi thì trả về màu mặc định.
  if (typeof tenMau !== "string") {
    return "var(--paper-3)";
  }

  // Biến này lưu tên màu đã chuyển về chữ thường theo tiếng Việt.
  const tenMauChuan = tenMau.toLocaleLowerCase("vi");

  // Biến này lưu mã màu đã biết trong bảng ánh xạ.
  const mauDaBiet = MAU_SAC_THEO_TEN[tenMauChuan];

  // Nếu đã có mã màu thì trả về luôn.
  if (mauDaBiet !== undefined) {
    return mauDaBiet;
  }

  return "var(--paper-3)";
}

// Hàm này lấy đối tượng thuộc tính của một phiên bản.
// Nếu phiên bản không có thuộc tính thì trả về đối tượng rỗng.
function layThuocTinhPhienBan(phienBan) {
  if (phienBan.attributes === undefined) {
    return THUOC_TINH_RONG;
  }

  if (phienBan.attributes === null) {
    return THUOC_TINH_RONG;
  }

  return phienBan.attributes;
}

// Hàm này nhóm các giá trị thuộc tính theo từng loại thuộc tính.
// Ví dụ: màu sắc có các giá trị đen, trắng; kích cỡ có M, L.
function taoNhomThuocTinh(danhSachPhienBan) {
  // Map lưu danh sách giá trị theo tên thuộc tính.
  const giaTriTheoThuocTinh = new Map();

  // Duyệt từng phiên bản để thu thập giá trị thuộc tính.
  for (const phienBan of danhSachPhienBan) {
    const thuocTinhPhienBan = layThuocTinhPhienBan(phienBan);
    const cacCapThuocTinh = Object.entries(thuocTinhPhienBan);

    for (const capThuocTinh of cacCapThuocTinh) {
      const tenThuocTinh = capThuocTinh[0];
      const giaTriThuocTinh = capThuocTinh[1];

      // Biến này lưu danh sách giá trị hiện có của thuộc tính.
      let danhSachGiaTri = giaTriTheoThuocTinh.get(tenThuocTinh);

      // Nếu thuộc tính chưa có trong Map thì tạo danh sách mới.
      if (danhSachGiaTri === undefined) {
        danhSachGiaTri = [];
        giaTriTheoThuocTinh.set(tenThuocTinh, danhSachGiaTri);
      }

      // Chỉ thêm giá trị nếu chưa có trong danh sách.
      if (danhSachGiaTri.includes(giaTriThuocTinh) === false) {
        danhSachGiaTri.push(giaTriThuocTinh);
      }
    }
  }

  // Mảng này lưu các nhóm thuộc tính theo thứ tự xuất hiện.
  const cacNhomThuocTinh = [];

  // Chuyển từng cặp trong Map thành một đối tượng nhóm.
  for (const capNhom of giaTriTheoThuocTinh) {
    const tenThuocTinh = capNhom[0];
    const cacGiaTri = capNhom[1];

    cacNhomThuocTinh.push({
      tenThuocTinh: tenThuocTinh,
      cacGiaTri: cacGiaTri,
    });
  }

  return cacNhomThuocTinh;
}

// Thành phần này hiển thị các nhóm thuộc tính để người dùng chọn phiên bản sản phẩm.
export default function ChonPhienBan(thuocTinh) {
  // Biến này lưu phiên bản đang được chọn.
  const phienBanDangChon = thuocTinh.phienBanDangChon;

  // Nếu chưa có phiên bản nào thì không cần hiển thị bộ chọn.
  if (phienBanDangChon === undefined) {
    return null;
  }

  if (phienBanDangChon === null) {
    return null;
  }

  // Biến này lưu danh sách toàn bộ phiên bản của sản phẩm.
  const danhSachPhienBan = thuocTinh.danhSachPhienBan;

  // Biến này lưu các nhóm thuộc tính cần hiển thị.
  const cacNhomThuocTinh = taoNhomThuocTinh(danhSachPhienBan);

  // Biến này lưu thuộc tính của phiên bản đang được chọn.
  const thuocTinhDangChon = layThuocTinhPhienBan(phienBanDangChon);

  // Hàm này tìm phiên bản khớp chính xác với thuộc tính vừa chọn
  // và vẫn giữ được các thuộc tính khác đang chọn.
  function timPhienBanChinhXac(tenThuocTinh, giaTriThuocTinh) {
    for (const phienBan of danhSachPhienBan) {
      const thuocTinhPhienBan = layThuocTinhPhienBan(phienBan);

      // Chỉ xét phiên bản có giá trị thuộc tính vừa chọn.
      if (thuocTinhPhienBan[tenThuocTinh] === giaTriThuocTinh) {
        // Biến này cho biết phiên bản có khớp tất cả thuộc tính đang chọn hay không.
        let khopTatCa = true;
        const cacCapDangChon = Object.entries(thuocTinhDangChon);

        for (const capDangChon of cacCapDangChon) {
          const tenDangChon = capDangChon[0];
          const giaTriDangChon = capDangChon[1];

          // Bỏ qua thuộc tính vừa chọn vì đã kiểm tra ở trên.
          if (tenDangChon !== tenThuocTinh) {
            if (thuocTinhPhienBan[tenDangChon] !== giaTriDangChon) {
              khopTatCa = false;
            }
          }
        }

        if (khopTatCa === true) {
          return phienBan;
        }
      }
    }

    return null;
  }

  // Hàm này tìm phiên bản đầu tiên có giá trị thuộc tính vừa chọn.
  // Hàm được dùng khi không tìm được phiên bản khớp hoàn toàn.
  function timPhienBanTheoMotThuocTinh(tenThuocTinh, giaTriThuocTinh) {
    for (const phienBan of danhSachPhienBan) {
      const thuocTinhPhienBan = layThuocTinhPhienBan(phienBan);

      if (thuocTinhPhienBan[tenThuocTinh] === giaTriThuocTinh) {
        return phienBan;
      }
    }

    return null;
  }

  // Hàm này xử lý khi người dùng chọn một giá trị thuộc tính.
  function xuLyChonThuocTinh(tenThuocTinh, giaTriThuocTinh) {
    const phienBanChinhXac = timPhienBanChinhXac(
      tenThuocTinh,
      giaTriThuocTinh,
    );
    const phienBanDuPhong = timPhienBanTheoMotThuocTinh(
      tenThuocTinh,
      giaTriThuocTinh,
    );

    // Mặc định dùng phiên bản dự phòng.
    let phienBanTiepTheo = phienBanDuPhong;

    // Nếu tìm được phiên bản khớp chính xác thì ưu tiên phiên bản đó.
    if (phienBanChinhXac !== null) {
      phienBanTiepTheo = phienBanChinhXac;
    }

    // Chỉ gọi thành phần cha khi tìm được phiên bản phù hợp.
    if (phienBanTiepTheo !== null) {
      thuocTinh.khiChonPhienBan(phienBanTiepTheo);
    }
  }

  // Mảng này lưu giao diện của từng nhóm thuộc tính.
  const cacNhomGiaoDien = [];

  // Tạo giao diện cho từng nhóm thuộc tính.
  for (const nhomThuocTinh of cacNhomThuocTinh) {
    const tenThuocTinh = nhomThuocTinh.tenThuocTinh;
    const nhanThuocTinh = layNhanThuocTinh(tenThuocTinh);
    const nhanThuocTinhChuThuong = nhanThuocTinh.toLocaleLowerCase("vi");

    // Biến này lưu giá trị đang được chọn của nhóm thuộc tính.
    let giaTriDangChon = "Chưa chọn";

    if (thuocTinhDangChon[tenThuocTinh] !== undefined) {
      if (thuocTinhDangChon[tenThuocTinh] !== null) {
        giaTriDangChon = thuocTinhDangChon[tenThuocTinh];
      }
    }

    // Mảng này lưu các nút chọn giá trị của nhóm.
    const cacNutChonGiaTri = [];

    // Tạo nút cho từng giá trị thuộc tính.
    for (const giaTriThuocTinh of nhomThuocTinh.cacGiaTri) {
      const giaTriHienTai = giaTriThuocTinh;

      // Biến này cho biết giá trị hiện tại có đang được chọn hay không.
      let dangDuocChon = false;
      if (thuocTinhDangChon[tenThuocTinh] === giaTriHienTai) {
        dangDuocChon = true;
      }

      // Phần tử này hiển thị chấm màu nếu nhóm thuộc tính là màu sắc.
      let phanTuChamMau = null;

      if (tenThuocTinh === "color") {
        const mauNen = layMauSac(giaTriHienTai);
        const kieuChamMau = { background: mauNen };

        phanTuChamMau = (
          <span className="swatch__dot" style={kieuChamMau} />
        );
      }

      // Hàm này chọn giá trị thuộc tính hiện tại.
      function xuLyChonGiaTri() {
        xuLyChonThuocTinh(tenThuocTinh, giaTriHienTai);
      }

      cacNutChonGiaTri.push(
        <button
          key={giaTriHienTai}
          className="swatch"
          type="button"
          aria-pressed={dangDuocChon}
          onClick={xuLyChonGiaTri}
        >
          {phanTuChamMau}
          {giaTriHienTai}
        </button>,
      );
    }

    const nhanNhomChon = "Chọn " + nhanThuocTinhChuThuong;

    cacNhomGiaoDien.push(
      <div className="option-block" key={tenThuocTinh}>
        <div className="option-head">
          <span>{nhanThuocTinh}</span>
          <span>{giaTriDangChon}</span>
        </div>
        <div
          className="swatches"
          role="group"
          aria-label={nhanNhomChon}
        >
          {cacNutChonGiaTri}
        </div>
      </div>,
    );
  }

  return cacNhomGiaoDien;
}
