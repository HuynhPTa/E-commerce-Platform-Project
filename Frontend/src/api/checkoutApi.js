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

// Hàm này gửi thông tin nhận hàng lên backend để tạo đơn.
// Hàm trả về phiên thanh toán và danh sách đơn hàng trong phiên.
export async function datHang(duLieuYeuCau) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.post("/checkout", duLieuYeuCau);

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này đọc lại kết quả thật của một phiên thanh toán từ backend.
// Hàm nhận vào mã phiên thanh toán và trả về trạng thái mới nhất.
export async function layKetQuaThanhToan(maPhienThanhToan) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get(
    "/checkout/" + maPhienThanhToan,
  );

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này yêu cầu backend tạo đường dẫn thanh toán VNPay hoặc MoMo.
// Hàm trả về mã giao dịch và đường dẫn chuyển sang cổng thanh toán.
export async function taoDuongDanThanhToan(duLieuYeuCau) {
  // Biến này lưu mã phiên thanh toán cần thanh toán.
  const maPhienThanhToan = duLieuYeuCau.checkoutSessionId;

  // Biến này lưu cổng thanh toán người dùng đã chọn.
  const congThanhToan = duLieuYeuCau.provider;

  // Biến này lưu dữ liệu gửi lên backend.
  const duLieuGuiDi = {
    checkoutSessionId: maPhienThanhToan,
    provider: congThanhToan,
  };

  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.post("/payments/create-url", duLieuGuiDi);

  return bocDuLieuKetQua(phanHoi);
}
