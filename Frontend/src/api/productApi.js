import { boGoiApi } from "./apiClient";

// Hàm này nhận vào bộ lọc sản phẩm,
// gọi backend để lấy một trang sản phẩm rồi trả về dữ liệu trang.
export async function layTrangSanPham(boLocSanPham) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get("/products", {
    params: boLocSanPham,
  });

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

// Hàm này nhận vào mã sản phẩm,
// gọi backend để lấy chi tiết sản phẩm rồi trả về dữ liệu sản phẩm.
export async function laySanPhamTheoMa(maSanPham) {
  // Biến này lưu phản hồi thô từ backend.
  const phanHoi = await boGoiApi.get("/products/" + maSanPham);

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
