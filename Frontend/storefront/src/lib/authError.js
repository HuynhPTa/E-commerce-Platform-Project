// Hàm này lấy thông điệp lỗi thân thiện từ phản hồi của backend.
// Tham số thongDiepMacDinh được dùng khi không đọc được thông điệp cụ thể.
export function layThongDiepLoiBackend(loi, thongDiepMacDinh) {
  // Biến này lưu thông điệp sẽ trả về.
  let thongDiep = thongDiepMacDinh;

  if (loi.response !== undefined) {
    if (loi.response !== null) {
      const duLieuLoi = loi.response.data;

      if (duLieuLoi !== undefined) {
        if (duLieuLoi !== null) {
          if (typeof duLieuLoi.message === "string") {
            if (duLieuLoi.message !== "") {
              thongDiep = duLieuLoi.message;
            }
          }
        }
      }
    }
  }

  return thongDiep;
}
