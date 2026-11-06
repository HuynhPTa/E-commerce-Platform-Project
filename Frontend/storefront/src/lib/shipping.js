// Tệp này chứa danh sách tỉnh/thành và quy tắc phí giao hàng của cửa hàng.
// Quy tắc phải khớp với ShippingPolicy ở backend.

// Mức tiền tối thiểu để được miễn phí giao hàng toàn quốc.
export const NGUONG_MIEN_PHI_GIAO_HANG = 499000;

// Danh sách tỉnh/thành miền Bắc.
export const CAC_TINH_MIEN_BAC = [
  "Hà Nội",
  "Hải Phòng",
  "Bắc Ninh",
  "Cao Bằng",
  "Điện Biên",
  "Hưng Yên",
  "Lai Châu",
  "Lạng Sơn",
  "Lào Cai",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ninh",
  "Sơn La",
  "Thái Nguyên",
  "Tuyên Quang",
];

// Danh sách tỉnh/thành miền Trung.
export const CAC_TINH_MIEN_TRUNG = [
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Quảng Trị",
  "Huế",
  "Đà Nẵng",
  "Quảng Ngãi",
  "Gia Lai",
  "Khánh Hòa",
  "Đắk Lắk",
  "Lâm Đồng",
];

// Danh sách tỉnh/thành miền Nam.
export const CAC_TINH_MIEN_NAM = [
  "Hồ Chí Minh",
  "Cần Thơ",
  "An Giang",
  "Cà Mau",
  "Đồng Nai",
  "Đồng Tháp",
  "Tây Ninh",
  "Vĩnh Long",
];

// Mảng này gom ba miền để biểu mẫu hiển thị theo nhóm.
export const NHOM_TINH_THANH = [
  { nhan: "Miền Bắc", tinhThanh: CAC_TINH_MIEN_BAC },
  { nhan: "Miền Trung", tinhThanh: CAC_TINH_MIEN_TRUNG },
  { nhan: "Miền Nam", tinhThanh: CAC_TINH_MIEN_NAM },
];

// Hàm này cho biết một tỉnh/thành có nằm trong danh sách hỗ trợ hay không.
export function laTinhThanhHoTro(tinhThanh) {
  if (typeof tinhThanh !== "string") {
    return false;
  }

  if (CAC_TINH_MIEN_BAC.includes(tinhThanh) === true) {
    return true;
  }

  if (CAC_TINH_MIEN_TRUNG.includes(tinhThanh) === true) {
    return true;
  }

  if (CAC_TINH_MIEN_NAM.includes(tinhThanh) === true) {
    return true;
  }

  return false;
}

// Hàm này trả về tên miền của một tỉnh/thành.
export function layMienCuaTinh(tinhThanh) {
  if (CAC_TINH_MIEN_BAC.includes(tinhThanh) === true) {
    return "Miền Bắc";
  }

  if (CAC_TINH_MIEN_TRUNG.includes(tinhThanh) === true) {
    return "Miền Trung";
  }

  if (CAC_TINH_MIEN_NAM.includes(tinhThanh) === true) {
    return "Miền Nam";
  }

  return "";
}

// Hàm này tính phí giao hàng theo tỉnh/thành và tạm tính.
// Đơn từ 499.000₫ miễn phí toàn quốc; dưới ngưỡng áp phí theo miền.
export function tinhPhiGiaoHang(tinhThanh, tamTinh) {
  const soTien = Number(tamTinh);

  if (Number.isFinite(soTien) === false) {
    return 0;
  }

  if (soTien >= NGUONG_MIEN_PHI_GIAO_HANG) {
    return 0;
  }

  if (CAC_TINH_MIEN_NAM.includes(tinhThanh) === true) {
    return 0;
  }

  if (CAC_TINH_MIEN_TRUNG.includes(tinhThanh) === true) {
    return 10000;
  }

  if (CAC_TINH_MIEN_BAC.includes(tinhThanh) === true) {
    return 20000;
  }

  return 0;
}
