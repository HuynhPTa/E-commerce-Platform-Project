import { boGoiApi } from "./apiClient";

// Hàm này gọi backend để lấy cây danh mục sản phẩm.
// Hàm không nhận tham số và trả về danh sách danh mục lồng nhau.
export async function layCayDanhMuc() {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get("/categories");

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
