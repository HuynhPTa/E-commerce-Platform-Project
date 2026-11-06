import { boGoiApi } from "./apiClient";

// Hàm này gọi backend để lấy danh sách mặt hàng trong giỏ.
// Hàm không nhận tham số và trả về danh sách mặt hàng.
export async function layGioHang() {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get("/cart");

  // Biến này lưu phần dữ liệu chính trong phản hồi.
  const duLieu = phanHoi.data;

  // Biến này lưu kết quả cuối cùng sau khi bóc lớp result nếu có.
  let ketQua = duLieu;

  // Nếu backend bọc dữ liệu trong trường result thì lấy trường đó.
  if (duLieu.result !== undefined) {
    // Tiếp tục kiểm tra null để tránh trả về giá trị rỗng không mong muốn.
    if (duLieu.result !== null) {
      ketQua = duLieu.result;
    }
  }

  return ketQua;
}

// Hàm này nhận vào mã phiên bản và số lượng,
// gọi backend để thêm mặt hàng vào giỏ rồi trả về kết quả.
export async function themVaoGioHang(duLieuYeuCau) {
  // Biến này lưu mã phiên bản sản phẩm cần thêm.
  const maPhienBan = duLieuYeuCau.variantId;

  // Biến này lưu số lượng sản phẩm cần thêm.
  const soLuong = duLieuYeuCau.quantity;

  // Biến này lưu dữ liệu gửi lên backend.
  const duLieuGuiDi = {
    variantId: maPhienBan,
    quantity: soLuong,
  };

  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.post("/cart", duLieuGuiDi);

  // Biến này lưu phần dữ liệu chính trong phản hồi.
  const duLieu = phanHoi.data;

  // Biến này lưu kết quả cuối cùng sau khi bóc lớp result nếu có.
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

// Hàm này nhận vào mã mặt hàng trong giỏ và số lượng mới,
// gọi backend để cập nhật số lượng rồi trả về kết quả.
export async function capNhatSoLuongMatHang(duLieuYeuCau) {
  // Biến này lưu mã mặt hàng cần cập nhật.
  const maMatHang = duLieuYeuCau.itemId;

  // Biến này lưu số lượng mới cần cập nhật.
  const soLuongMoi = duLieuYeuCau.quantity;

  // Biến này lưu dữ liệu gửi lên backend.
  const duLieuGuiDi = {
    quantity: soLuongMoi,
  };

  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.put("/cart/" + maMatHang, duLieuGuiDi);

  // Biến này lưu phần dữ liệu chính trong phản hồi.
  const duLieu = phanHoi.data;

  // Biến này lưu kết quả cuối cùng sau khi bóc lớp result nếu có.
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

// Hàm này nhận vào mã mặt hàng trong giỏ,
// gọi backend để xoá mặt hàng đó khỏi giỏ rồi trả về kết quả.
export async function xoaMatHangKhoiGio(maMatHang) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.delete("/cart/" + maMatHang);

  return phanHoi.data;
}
