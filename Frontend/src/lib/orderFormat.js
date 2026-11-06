// Bảng này đổi tên thuộc tính kỹ thuật sang nhãn tiếng Việt dễ đọc.
const BANG_NHAN_THUOC_TINH = {
  color: "Màu",
  size: "Kích thước",
  layout: "Bố cục",
  switch: "Loại switch",
  set: "Bộ",
  "loại": "Loại",
};

// Hàm này trả về nhãn tiếng Việt của một thuộc tính phiên bản.
// Nếu chưa có nhãn phù hợp thì giữ nguyên tên thuộc tính.
export function taoNhanThuocTinh(khoaThuocTinh) {
  const nhanDaBiet = BANG_NHAN_THUOC_TINH[khoaThuocTinh];

  if (nhanDaBiet !== undefined) {
    return nhanDaBiet;
  }

  return khoaThuocTinh;
}

// Hàm này ghép các thuộc tính của phiên bản thành một chuỗi dễ đọc.
export function taoChuoiThuocTinh(thuocTinhPhienBan) {
  if (thuocTinhPhienBan === undefined) {
    return "";
  }

  if (thuocTinhPhienBan === null) {
    return "";
  }

  const cacCapThuocTinh = Object.entries(thuocTinhPhienBan);
  const cacPhan = [];

  for (const capThuocTinh of cacCapThuocTinh) {
    const khoaThuocTinh = capThuocTinh[0];
    const giaTriThuocTinh = capThuocTinh[1];
    const nhanThuocTinh = taoNhanThuocTinh(khoaThuocTinh);
    cacPhan.push(nhanThuocTinh + ": " + giaTriThuocTinh);
  }

  return cacPhan.join(" · ");
}

// Hàm này trả về nhãn tiếng Việt của một trạng thái đơn hàng.
export function layNhanTrangThaiDonHang(trangThai) {
  if (trangThai === "PENDING") {
    return "Chờ xác nhận";
  }

  if (trangThai === "CONFIRMED") {
    return "Đã xác nhận";
  }

  if (trangThai === "SHIPPING") {
    return "Đang giao";
  }

  if (trangThai === "DELIVERED") {
    return "Đã giao";
  }

  if (trangThai === "COMPLETED") {
    return "Hoàn tất";
  }

  if (trangThai === "CANCELLED") {
    return "Đã huỷ";
  }

  if (typeof trangThai !== "string") {
    return "Không xác định";
  }

  if (trangThai === "") {
    return "Không xác định";
  }

  return trangThai;
}

// Hàm này trả về lớp CSS tương ứng với trạng thái đơn hàng.
export function layLopTrangThaiDonHang(trangThai) {
  if (trangThai === "PENDING") {
    return "status status--pending";
  }

  if (trangThai === "CONFIRMED") {
    return "status status--confirmed";
  }

  if (trangThai === "SHIPPING") {
    return "status status--shipping";
  }

  if (trangThai === "DELIVERED") {
    return "status status--delivered";
  }

  if (trangThai === "COMPLETED") {
    return "status status--completed";
  }

  if (trangThai === "CANCELLED") {
    return "status status--cancelled";
  }

  return "status";
}

// Hàm này trả về nhãn tiếng Việt của một cổng thanh toán.
export function layNhanPhuongThucThanhToan(phuongThuc) {
  if (phuongThuc === "VNPAY") {
    return "VNPay";
  }

  if (phuongThuc === "MOMO") {
    return "MoMo";
  }

  if (phuongThuc === "COD") {
    return "Thanh toán khi nhận hàng (COD)";
  }

  if (typeof phuongThuc !== "string") {
    return "Không xác định";
  }

  if (phuongThuc === "") {
    return "Không xác định";
  }

  return phuongThuc;
}

// Hàm này trả về nhãn tiếng Việt của một trạng thái thanh toán.
export function layNhanTrangThaiThanhToan(trangThai) {
  if (trangThai === undefined) {
    return "Chưa tạo giao dịch";
  }

  if (trangThai === null) {
    return "Chưa tạo giao dịch";
  }

  if (trangThai === "PENDING") {
    return "Chờ thanh toán";
  }

  if (trangThai === "SUCCEEDED") {
    return "Đã thanh toán";
  }

  if (trangThai === "FAILED") {
    return "Thanh toán thất bại";
  }

  if (typeof trangThai !== "string") {
    return "Không xác định";
  }

  if (trangThai === "") {
    return "Không xác định";
  }

  return trangThai;
}

// Hàm này trả về lớp CSS tương ứng với trạng thái thanh toán.
export function layLopTrangThaiThanhToan(trangThai) {
  if (trangThai === "SUCCEEDED") {
    return "status status--completed";
  }

  if (trangThai === "FAILED") {
    return "status status--cancelled";
  }

  if (trangThai === "PENDING") {
    return "status status--pending";
  }

  return "status";
}

// Hàm này thêm số 0 phía trước khi giá trị nhỏ hơn 10.
function themSoKhong(giaTri) {
  if (giaTri < 10) {
    return "0" + giaTri;
  }

  return "" + giaTri;
}

// Hàm này định dạng một thời điểm thành ngày và giờ theo cách viết Việt Nam.
export function dinhDangNgayGio(thoiDiem) {
  // Biến này lưu đối tượng ngày được tạo từ dữ liệu backend.
  const ngayCanDinhDang = new Date(thoiDiem);

  // Nếu ngày không hợp lệ thì trả về chuỗi rỗng.
  if (Number.isNaN(ngayCanDinhDang.getTime()) === true) {
    return "";
  }

  // Biến này lưu ngày trong tháng đã có đủ hai chữ số.
  const ngayTrongThang = themSoKhong(ngayCanDinhDang.getDate());

  // Biến này lưu tháng đã có đủ hai chữ số.
  const thangTrongNam = themSoKhong(ngayCanDinhDang.getMonth() + 1);

  // Biến này lưu giờ đã có đủ hai chữ số.
  const gioTrongNgay = themSoKhong(ngayCanDinhDang.getHours());

  // Biến này lưu phút đã có đủ hai chữ số.
  const phutTrongGio = themSoKhong(ngayCanDinhDang.getMinutes());

  return (
    ngayTrongThang +
    "/" +
    thangTrongNam +
    "/" +
    ngayCanDinhDang.getFullYear() +
    " · " +
    gioTrongNgay +
    ":" +
    phutTrongGio
  );
}

// Hàm này định dạng một thời điểm thành ngày tháng ngắn gọn.
export function dinhDangNgayNgan(thoiDiem) {
  // Biến này lưu đối tượng ngày được tạo từ dữ liệu backend.
  const ngayCanDinhDang = new Date(thoiDiem);

  // Nếu ngày không hợp lệ thì trả về chuỗi rỗng.
  if (Number.isNaN(ngayCanDinhDang.getTime()) === true) {
    return "";
  }

  // Biến này lưu ngày trong tháng đã có đủ hai chữ số.
  const ngayTrongThang = themSoKhong(ngayCanDinhDang.getDate());

  // Biến này lưu tháng đã có đủ hai chữ số.
  const thangTrongNam = themSoKhong(ngayCanDinhDang.getMonth() + 1);

  return ngayTrongThang + "/" + thangTrongNam;
}
