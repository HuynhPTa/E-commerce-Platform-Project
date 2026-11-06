import { CAC_LUA_CHON_SAP_XEP } from "../../lib/productListSearch.js";

// Thành phần này hiển thị số lượng sản phẩm đang xem và ô chọn cách sắp xếp.
export default function ThanhCongCuDanhSach(thuocTinh) {
  // Phần tử này hiển thị thông tin đếm sản phẩm.
  let phanTuDemSanPham;

  // Nếu không có sản phẩm nào thì hiển thị thông báo rỗng.
  if (thuocTinh.tongSoSanPham === 0) {
    phanTuDemSanPham = "Không có sản phẩm";
  } else {
    phanTuDemSanPham = (
      <>
        Hiển thị{" "}
        <strong>
          {thuocTinh.viTriDauTien}-{thuocTinh.viTriCuoiCung}
        </strong>{" "}
        trong <strong>{thuocTinh.tongSoSanPham}</strong> sản phẩm
      </>
    );
  }

  // Mảng này lưu các lựa chọn sắp xếp trước khi đưa vào giao diện.
  const cacLuaChonSapXep = [];

  // Tạo từng lựa chọn sắp xếp từ danh sách có sẵn.
  for (const luaChon of CAC_LUA_CHON_SAP_XEP) {
    cacLuaChonSapXep.push(
      <option key={luaChon.value} value={luaChon.value}>
        {luaChon.label}
      </option>,
    );
  }

  // Hàm này gửi giá trị sắp xếp mới lên thành phần cha.
  function xuLyDoiSapXep(suKienChon) {
    thuocTinh.khiDoiSapXep(suKienChon.target.value);
  }

  return (
    <div className="catalog-toolbar">
      <div className="catalog-toolbar__count">{phanTuDemSanPham}</div>

      <label className="sort-control" htmlFor="product-sort">
        Sắp xếp
        <select
          id="product-sort"
          value={thuocTinh.sapXep}
          onChange={xuLyDoiSapXep}
        >
          {cacLuaChonSapXep}
        </select>
      </label>
    </div>
  );
}
