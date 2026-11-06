import NhomBoLoc from "./FilterGroup.jsx";

// Thành phần này hiển thị danh sách danh mục để người dùng chọn bộ lọc.
export default function BoLocDanhMuc(thuocTinh) {
  // Biến này cho biết người dùng đang chọn "Tất cả sản phẩm" hay không.
  let dangChonTatCa = false;

  // Nếu chưa có danh mục nào được chọn thì coi như đang chọn tất cả.
  if (thuocTinh.slugDanhMucDangChon === undefined) {
    dangChonTatCa = true;
  }

  // Trường hợp tham số danh mục là null cũng coi như chọn tất cả.
  if (thuocTinh.slugDanhMucDangChon === null) {
    dangChonTatCa = true;
  }

  // Trường hợp tham số danh mục là chuỗi rỗng cũng coi như chọn tất cả.
  if (thuocTinh.slugDanhMucDangChon === "") {
    dangChonTatCa = true;
  }

  // Biến này lưu nhãn số lượng sản phẩm của mục "Tất cả sản phẩm".
  let nhanTongSoSanPham = "…";

  // Nếu đã có tổng số sản phẩm thì hiển thị số đó.
  if (thuocTinh.tongSoSanPham !== undefined) {
    if (thuocTinh.tongSoSanPham !== null) {
      nhanTongSoSanPham = thuocTinh.tongSoSanPham;
    }
  }

  // Hàm này xử lý khi người dùng chọn "Tất cả sản phẩm".
  function xuLyChonTatCa() {
    thuocTinh.khiChonDanhMuc(undefined);
  }

  // Mảng này lưu các lựa chọn danh mục trước khi đưa vào giao diện.
  const cacLuaChonDanhMuc = [];

  // Tạo từng lựa chọn danh mục từ danh sách danh mục nhận được.
  for (const danhMuc of thuocTinh.danhSachDanhMuc) {
    // Biến này cho biết danh mục hiện tại có đang được chọn hay không.
    let dangDuocChon = false;
    if (thuocTinh.slugDanhMucDangChon === danhMuc.slug) {
      dangDuocChon = true;
    }

    // Biến này lưu số lượng sản phẩm của danh mục hiện tại.
    const soLuongSanPham = thuocTinh.soLuongTheoSlug[danhMuc.slug];

    // Biến này lưu nhãn hiển thị số lượng sản phẩm.
    let nhanSoLuongSanPham = "…";

    // Nếu đã có số lượng thì hiển thị số đó, kể cả số 0.
    if (soLuongSanPham !== undefined) {
      if (soLuongSanPham !== null) {
        nhanSoLuongSanPham = soLuongSanPham;
      }
    }

    // Hàm này xử lý khi người dùng chọn danh mục hiện tại.
    function xuLyChonDanhMuc() {
      thuocTinh.khiChonDanhMuc(danhMuc.slug);
    }

    cacLuaChonDanhMuc.push(
      <label className="checkbox" key={danhMuc.id}>
        <input
          type="radio"
          name="category"
          checked={dangDuocChon}
          onChange={xuLyChonDanhMuc}
        />
        <span>{danhMuc.name}</span>
        <span>{nhanSoLuongSanPham}</span>
      </label>,
    );
  }

  return (
    <NhomBoLoc tieuDe="Danh mục" moBanDau={true}>
      <div className="filter-options">
        <label className="checkbox">
          <input
            type="radio"
            name="category"
            checked={dangChonTatCa}
            onChange={xuLyChonTatCa}
          />
          <span>Tất cả sản phẩm</span>
          <span>{nhanTongSoSanPham}</span>
        </label>

        {cacLuaChonDanhMuc}
      </div>
    </NhomBoLoc>
  );
}
