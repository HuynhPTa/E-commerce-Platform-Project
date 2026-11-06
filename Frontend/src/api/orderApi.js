import { boGoiApi } from "./apiClient";

// Hàm này bóc lớp result của phản hồi backend nếu có.
// Hàm nhận vào phản hồi thô và trả về phần dữ liệu chính.
function bocDuLieuKetQua(phanHoi) {
  // Biến này lưu phần dữ liệu chính trong phản hồi.
  const duLieu = phanHoi.data;

  // Biến này lưu kết quả cuối cùng sau khi bóc lớp result.
  let ketQua = duLieu;

  // Nếu backend bọc dữ liệu trong trường result thì lấy trường đó.
  if (duLieu.result !== undefined) {
    // Tiếp tục kiểm tra null trước khi gán.
    if (duLieu.result !== null) {
      ketQua = duLieu.result;
    }
  }

  return ketQua;
}

// Hàm này gọi backend để lấy danh sách đơn hàng của người đang đăng nhập.
// Hàm nhận vào trạng thái lọc, số trang và số đơn mỗi trang.
export async function layDanhSachDonHang(thamSoLoc) {
  // Biến này lưu cấu hình gửi kèm yêu cầu.
  const cauHinh = {
    params: {
      page: thamSoLoc.page,
      size: thamSoLoc.size,
    },
  };

  // Chỉ gửi trạng thái khi người dùng đã chọn một trạng thái cụ thể.
  if (thamSoLoc.status !== undefined) {
    if (thamSoLoc.status !== "") {
      cauHinh.params.status = thamSoLoc.status;
    }
  }

  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get("/orders", cauHinh);

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này gọi backend để lấy chi tiết một đơn hàng của người đang đăng nhập.
// Hàm nhận vào mã đơn hàng và trả về dữ liệu chi tiết.
export async function layChiTietDonHang(maDonHang) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get("/orders/" + maDonHang);

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này gửi yêu cầu huỷ đơn hàng của người đang đăng nhập.
// Hàm nhận vào mã đơn hàng và trả về chi tiết đơn sau khi huỷ.
export async function huyDonHang(maDonHang) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.post("/orders/" + maDonHang + "/cancel");

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này cập nhật thông tin nhận hàng của một đơn đang chờ xác nhận.
// Hàm nhận vào mã đơn hàng và dữ liệu địa chỉ mới.
export async function capNhatThongTinNhanHang(maDonHang, duLieuDiaChi) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.patch(
    "/orders/" + maDonHang + "/shipping",
    duLieuDiaChi,
  );

  return bocDuLieuKetQua(phanHoi);
}
