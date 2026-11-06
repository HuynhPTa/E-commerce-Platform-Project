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

// Hàm này gọi backend để lấy danh sách địa chỉ của người đang đăng nhập.
// Hàm không nhận tham số và trả về danh sách địa chỉ đã lưu.
export async function layDanhSachDiaChi() {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get("/addresses");

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này gửi một địa chỉ mới lên backend.
// Hàm nhận vào thông tin địa chỉ và trả về địa chỉ vừa tạo.
export async function taoDiaChiMoi(duLieuDiaChi) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.post("/addresses", duLieuDiaChi);

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này cập nhật một địa chỉ đã lưu của người đang đăng nhập.
// Hàm nhận vào mã địa chỉ và thông tin mới, sau đó trả về địa chỉ đã cập nhật.
export async function capNhatDiaChi(maDiaChi, duLieuDiaChi) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.put("/addresses/" + maDiaChi, duLieuDiaChi);

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này xoá một địa chỉ đã lưu của người đang đăng nhập.
// Hàm nhận vào mã địa chỉ và không trả về dữ liệu.
export async function xoaDiaChi(maDiaChi) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.delete("/addresses/" + maDiaChi);

  return bocDuLieuKetQua(phanHoi);
}

// Hàm này đặt một địa chỉ đã lưu làm địa chỉ mặc định.
// Hàm nhận vào mã địa chỉ và trả về địa chỉ sau khi cập nhật.
export async function datDiaChiMacDinh(maDiaChi) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.put("/addresses/" + maDiaChi + "/default");

  return bocDuLieuKetQua(phanHoi);
}
