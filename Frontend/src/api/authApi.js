import { boGoiApi } from "./apiClient";

// Hàm này gửi thông tin đăng nhập lên backend và trả về phản hồi đã bóc dữ liệu.
export async function dangNhap(thongTinDangNhap) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.post("/auth/login", thongTinDangNhap);

  return phanHoi.data;
}

// Hàm này gửi thông tin đăng ký lên backend và trả về phản hồi đã bóc dữ liệu.
export async function dangKy(thongTinDangKy) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.post("/auth/register", thongTinDangKy);

  return phanHoi.data;
}

// Hàm này lấy thông tin tài khoản đang đăng nhập từ backend.
export async function layThongTinCaNhan() {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get("/me");

  // Biến này lưu phần dữ liệu chính trong phản hồi.
  const duLieu = phanHoi.data;

  // Biến này lưu kết quả cuối cùng sau khi bóc lớp result nếu có.
  let ketQua = duLieu;

  // Nếu backend bọc dữ liệu trong trường result thì lấy trường đó.
  if (duLieu.result !== undefined) {
    if (duLieu.result !== null) {
      ketQua = duLieu.result;
    }
  }

  return ketQua;
}

// Hàm này gửi thông tin cá nhân mới lên backend.
// Hàm nhận vào dữ liệu hồ sơ và trả về hồ sơ sau khi cập nhật.
export async function capNhatThongTinCaNhan(duLieuHoSo) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.put("/me", duLieuHoSo);

  // Biến này lưu phần dữ liệu chính trong phản hồi.
  const duLieu = phanHoi.data;

  // Biến này lưu kết quả cuối cùng sau khi bóc lớp result nếu có.
  let ketQua = duLieu;

  // Nếu backend bọc dữ liệu trong trường result thì lấy trường đó.
  if (duLieu.result !== undefined) {
    if (duLieu.result !== null) {
      ketQua = duLieu.result;
    }
  }

  return ketQua;
}
