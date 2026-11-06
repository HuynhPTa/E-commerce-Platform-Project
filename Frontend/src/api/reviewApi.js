import { boGoiApi } from "./apiClient";

// Hàm này nhận vào mã sản phẩm,
// gọi backend để lấy danh sách đánh giá rồi trả về dữ liệu trang đánh giá.
export async function layDanhGiaSanPham(maSanPham) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get(
    "/products/" + maSanPham + "/reviews",
    {
      params: {
        page: 1,
        size: 50,
      },
    },
  );

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
