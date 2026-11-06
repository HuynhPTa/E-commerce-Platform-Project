// Biến này lưu số sản phẩm hiển thị trên mỗi trang danh sách.
export const SO_SAN_PHAM_MOI_TRANG = 12;

// Biến này lưu các lựa chọn sắp xếp hiển thị cho người dùng.
export const CAC_LUA_CHON_SAP_XEP = [
  {
    value: "newest",
    label: "Mới nhất",
  },
  {
    value: "best_selling",
    label: "Bán chạy",
  },
  {
    value: "price_asc",
    label: "Giá thấp đến cao",
  },
  {
    value: "price_desc",
    label: "Giá cao đến thấp",
  },
];

// Biến này lưu các giá trị sắp xếp hợp lệ để kiểm tra tham số trên đường dẫn.
const CAC_GIA_TRI_SAP_XEP_HOP_LE = new Set();

for (const luaChonSapXep of CAC_LUA_CHON_SAP_XEP) {
  CAC_GIA_TRI_SAP_XEP_HOP_LE.add(luaChonSapXep.value);
}

// Hàm này nhận vào giá trị giá còn thô trên đường dẫn,
// trả về số hợp lệ hoặc undefined nếu giá trị không dùng được.
function docGiaTriGia(giaTriTho) {
  // Nếu không có giá trị thì trả về undefined.
  if (giaTriTho === undefined) {
    return undefined;
  }

  if (giaTriTho === null) {
    return undefined;
  }

  // Biến này lưu giá trị sau khi bỏ khoảng trắng ở hai đầu.
  const giaTriDaCat = giaTriTho.trim();

  // Nếu chuỗi rỗng thì coi như không có giá trị.
  if (giaTriDaCat === "") {
    return undefined;
  }

  // Biến này lưu giá trị sau khi chuyển sang dạng số.
  const giaTriSo = Number(giaTriDaCat);

  // Nếu không phải số hữu hạn thì không dùng được.
  if (Number.isFinite(giaTriSo) === false) {
    return undefined;
  }

  // Nếu là số âm thì không dùng được.
  if (giaTriSo < 0) {
    return undefined;
  }

  return giaTriSo;
}

// Hàm này nhận vào giá trị trang còn thô trên đường dẫn,
// trả về số trang hợp lệ hoặc 1 nếu giá trị không dùng được.
function docSoTrang(giaTriTho) {
  // Biến này lưu số trang mặc định.
  let soTrang = 1;

  // Nếu có giá trị thì mới kiểm tra tiếp.
  if (giaTriTho !== undefined) {
    if (giaTriTho !== null) {
      // Biến này lưu giá trị sau khi chuyển sang dạng số.
      const giaTriSo = Number(giaTriTho);

      // Nếu là số nguyên dương thì dùng giá trị đó.
      if (Number.isInteger(giaTriSo) === true) {
        if (giaTriSo > 0) {
          soTrang = giaTriSo;
        }
      }
    }
  }

  return soTrang;
}

// Hàm này nhận vào các tham số trên đường dẫn,
// đọc và trả về bộ lọc sản phẩm đã được chuẩn hoá.
export function docBoLocDanhSachSanPham(thamSoTimKiem) {
  // Biến này lưu danh mục đang được chọn.
  let danhMuc = undefined;
  const giaTriDanhMuc = thamSoTimKiem.get("category");

  if (giaTriDanhMuc !== null) {
    if (giaTriDanhMuc !== "") {
      danhMuc = giaTriDanhMuc;
    }
  }

  // Biến này lưu từ khoá tìm kiếm đã được bỏ khoảng trắng ở hai đầu.
  let tuKhoa = undefined;
  const giaTriTuKhoa = thamSoTimKiem.get("q");

  if (giaTriTuKhoa !== null) {
    const tuKhoaDaCat = giaTriTuKhoa.trim();

    if (tuKhoaDaCat !== "") {
      tuKhoa = tuKhoaDaCat;
    }
  }

  // Biến này lưu cách sắp xếp đang được chọn.
  let sapXep = "newest";
  const giaTriSapXep = thamSoTimKiem.get("sort");

  if (giaTriSapXep !== null) {
    if (CAC_GIA_TRI_SAP_XEP_HOP_LE.has(giaTriSapXep) === true) {
      sapXep = giaTriSapXep;
    }
  }

  // Biến này lưu giá thấp nhất và giá cao nhất sau khi đọc.
  const giaThapNhat = docGiaTriGia(thamSoTimKiem.get("minPrice"));
  const giaCaoNhat = docGiaTriGia(thamSoTimKiem.get("maxPrice"));

  // Biến này lưu số trang hiện tại.
  const soTrang = docSoTrang(thamSoTimKiem.get("page"));

  return {
    category: danhMuc,
    minPrice: giaThapNhat,
    maxPrice: giaCaoNhat,
    sort: sapXep,
    page: soTrang,
    q: tuKhoa,
    size: SO_SAN_PHAM_MOI_TRANG,
  };
}

// Hàm này nhận vào tham số hiện tại và các thay đổi cần áp dụng,
// trả về bộ tham số mới để đưa lên đường dẫn.
export function taoThamSoTimKiemDaCapNhat(thamSoHienTai, cacThayDoi) {
  // Biến này lưu bản sao của bộ tham số hiện tại.
  const thamSoMoi = new URLSearchParams(thamSoHienTai);

  // Biến này lưu danh sách tên tham số cần xử lý.
  const cacTenThamSo = Object.keys(cacThayDoi);

  for (const tenThamSo of cacTenThamSo) {
    const giaTri = cacThayDoi[tenThamSo];

    // Biến này cho biết tham số có cần xoá khỏi đường dẫn hay không.
    let canXoa = false;

    if (giaTri === undefined) {
      canXoa = true;
    }

    if (giaTri === null) {
      canXoa = true;
    }

    if (giaTri === "") {
      canXoa = true;
    }

    // Nếu cần xoá thì xoá tham số khỏi đường dẫn.
    if (canXoa === true) {
      thamSoMoi.delete(tenThamSo);
    } else {
      // Ngược lại thì ghi giá trị mới vào tham số.
      thamSoMoi.set(tenThamSo, String(giaTri));
    }
  }

  return thamSoMoi;
}
