// Hàm này nhận vào số tiền, chuyển về dạng số an toàn
// rồi trả về chuỗi tiền tệ theo định dạng Việt Nam.
export function dinhDangTien(soTien) {
  // Biến này lưu giá trị số sau khi kiểm tra dữ liệu đầu vào.
  let giaTriSo = 0;

  // Nếu số tiền được truyền vào thì mới chuyển sang dạng số.
  if (soTien !== undefined) {
    // Tiếp tục kiểm tra null trước khi chuyển đổi.
    if (soTien !== null) {
      giaTriSo = Number(soTien);
    }
  }

  // Nếu giá trị không phải là số hữu hạn thì quay về 0.
  if (Number.isFinite(giaTriSo) === false) {
    giaTriSo = 0;
  }

  return giaTriSo.toLocaleString("vi-VN") + "₫";
}
