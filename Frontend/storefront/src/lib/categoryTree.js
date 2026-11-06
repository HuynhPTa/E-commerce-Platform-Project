// Hàm này nhận vào danh sách danh mục và mã danh mục cần tìm,
// trả về đường dẫn từ danh mục gốc tới danh mục đó.
export function timDuongDanDanhMuc(danhSachDanhMuc, maDanhMuc) {
  // Nếu danh sách danh mục không hợp lệ thì trả về mảng rỗng.
  if (danhSachDanhMuc === undefined) {
    return [];
  }

  if (danhSachDanhMuc === null) {
    return [];
  }

  // Biến này lưu mã danh mục đã chuyển sang dạng số.
  const maDanhMucCanTim = Number(maDanhMuc);

  // Nếu mã danh mục không phải số nguyên thì trả về mảng rỗng.
  if (Number.isInteger(maDanhMucCanTim) === false) {
    return [];
  }

  for (const danhMuc of danhSachDanhMuc) {
    // Nếu danh mục hiện tại chính là danh mục cần tìm thì trả về một mảng chứa nó.
    if (danhMuc.id === maDanhMucCanTim) {
      return [danhMuc];
    }

    // Biến này lưu danh sách danh mục con của danh mục hiện tại.
    let danhSachDanhMucCon = [];

    // Nếu danh mục có danh sách con thì mới đọc tiếp.
    if (danhMuc.children !== undefined) {
      if (danhMuc.children !== null) {
        danhSachDanhMucCon = danhMuc.children;
      }
    }

    // Biến này lưu đường dẫn tìm được trong nhánh danh mục con.
    const duongDanTrongNhanhCon = timDuongDanDanhMuc(
      danhSachDanhMucCon,
      maDanhMucCanTim,
    );

    // Nếu tìm thấy trong nhánh con thì ghép danh mục hiện tại vào đầu đường dẫn.
    if (duongDanTrongNhanhCon.length > 0) {
      const duongDanDayDu = [danhMuc];

      for (const danhMucCon of duongDanTrongNhanhCon) {
        duongDanDayDu.push(danhMucCon);
      }

      return duongDanDayDu;
    }
  }

  return [];
}
