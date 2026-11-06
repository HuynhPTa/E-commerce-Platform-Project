import { useState } from "react";
import NhomBoLoc from "./FilterGroup.jsx";

// Hàm này đọc chuỗi giá do người dùng nhập,
// trả về giá trị số và trạng thái hợp lệ của giá trị đó.
function docGiaTriGiaNhap(chuoiNhap) {
  // Biến này lưu chuỗi sau khi bỏ khoảng trắng ở hai đầu.
  const chuoiDaCat = chuoiNhap.trim();

  // Nếu người dùng để trống thì coi như không lọc theo giá.
  if (chuoiDaCat === "") {
    return { giaTri: undefined, hopLe: true };
  }

  // Biến này lưu giá trị sau khi chuyển sang dạng số.
  const giaTriSo = Number(chuoiDaCat);

  // Mặc định giá trị nhập vào là hợp lệ.
  let hopLe = true;

  // Giá phải là số hữu hạn.
  if (Number.isFinite(giaTriSo) === false) {
    hopLe = false;
  }

  // Giá không được là số âm.
  if (giaTriSo < 0) {
    hopLe = false;
  }

  return { giaTri: giaTriSo, hopLe: hopLe };
}

// Thành phần này hiển thị bộ lọc khoảng giá và xử lý việc áp dụng, xoá bộ lọc.
export default function BoLocGia(thuocTinh) {
  // Biến này lưu chuỗi giá thấp nhất ban đầu.
  let giaThapNhatBanDau = "";

  // Nếu thành phần cha có truyền giá thấp nhất thì chuyển sang chuỗi.
  if (thuocTinh.giaThapNhat !== undefined) {
    if (thuocTinh.giaThapNhat !== null) {
      giaThapNhatBanDau = String(thuocTinh.giaThapNhat);
    }
  }

  // Biến này lưu chuỗi giá cao nhất ban đầu.
  let giaCaoNhatBanDau = "";

  // Nếu thành phần cha có truyền giá cao nhất thì chuyển sang chuỗi.
  if (thuocTinh.giaCaoNhat !== undefined) {
    if (thuocTinh.giaCaoNhat !== null) {
      giaCaoNhatBanDau = String(thuocTinh.giaCaoNhat);
    }
  }

  // Trạng thái này lưu nội dung ô nhập giá thấp nhất.
  const trangThaiGiaThapNhat = useState(giaThapNhatBanDau);

  // Biến này lưu chuỗi giá thấp nhất đang hiển thị.
  const giaThapNhatDangNhap = trangThaiGiaThapNhat[0];

  // Biến này lưu hàm cập nhật ô nhập giá thấp nhất.
  const capNhatGiaThapNhat = trangThaiGiaThapNhat[1];

  // Trạng thái này lưu nội dung ô nhập giá cao nhất.
  const trangThaiGiaCaoNhat = useState(giaCaoNhatBanDau);

  // Biến này lưu chuỗi giá cao nhất đang hiển thị.
  const giaCaoNhatDangNhap = trangThaiGiaCaoNhat[0];

  // Biến này lưu hàm cập nhật ô nhập giá cao nhất.
  const capNhatGiaCaoNhat = trangThaiGiaCaoNhat[1];

  // Trạng thái này lưu thông báo lỗi khi giá nhập không hợp lệ.
  const trangThaiThongBaoLoi = useState("");

  // Biến này lưu nội dung thông báo lỗi hiện tại.
  const thongBaoLoi = trangThaiThongBaoLoi[0];

  // Biến này lưu hàm cập nhật thông báo lỗi.
  const capNhatThongBaoLoi = trangThaiThongBaoLoi[1];

  // Biến này cho biết người dùng đang áp dụng bộ lọc giá hay không.
  let coBoLocGiaDangDung = false;

  // Nếu có giá thấp nhất thì bộ lọc giá đang được dùng.
  if (thuocTinh.giaThapNhat !== undefined) {
    coBoLocGiaDangDung = true;
  }

  // Nếu có giá cao nhất thì bộ lọc giá đang được dùng.
  if (thuocTinh.giaCaoNhat !== undefined) {
    coBoLocGiaDangDung = true;
  }

  // Hàm này cập nhật ô nhập giá thấp nhất.
  function xuLyThayDoiGiaThapNhat(suKienNhap) {
    capNhatGiaThapNhat(suKienNhap.target.value);
  }

  // Hàm này cập nhật ô nhập giá cao nhất.
  function xuLyThayDoiGiaCaoNhat(suKienNhap) {
    capNhatGiaCaoNhat(suKienNhap.target.value);
  }

  // Hàm này kiểm tra dữ liệu và gửi khoảng giá đã chọn lên thành phần cha.
  function xuLyApDung() {
    const ketQuaGiaThapNhat = docGiaTriGiaNhap(giaThapNhatDangNhap);
    const ketQuaGiaCaoNhat = docGiaTriGiaNhap(giaCaoNhatDangNhap);

    // Mặc định dữ liệu nhập vào hợp lệ.
    let duLieuHopLe = true;

    // Nếu một trong hai giá không hợp lệ thì đánh dấu dữ liệu không hợp lệ.
    if (ketQuaGiaThapNhat.hopLe === false) {
      duLieuHopLe = false;
    }

    if (ketQuaGiaCaoNhat.hopLe === false) {
      duLieuHopLe = false;
    }

    // Nếu dữ liệu không hợp lệ thì hiển thị lỗi và dừng lại.
    if (duLieuHopLe === false) {
      capNhatThongBaoLoi("Giá phải là số không âm.");
      return;
    }

    // Nếu có đủ hai giá thì kiểm tra giá thấp nhất không lớn hơn giá cao nhất.
    if (ketQuaGiaThapNhat.giaTri !== undefined) {
      if (ketQuaGiaCaoNhat.giaTri !== undefined) {
        if (ketQuaGiaThapNhat.giaTri > ketQuaGiaCaoNhat.giaTri) {
          capNhatThongBaoLoi(
            "Giá thấp nhất phải nhỏ hơn hoặc bằng giá cao nhất.",
          );
          return;
        }
      }
    }

    capNhatThongBaoLoi("");

    // Biến này lưu khoảng giá gửi lên thành phần cha.
    const duLieuGui = {
      giaThapNhat: ketQuaGiaThapNhat.giaTri,
      giaCaoNhat: ketQuaGiaCaoNhat.giaTri,
    };

    thuocTinh.khiApDung(duLieuGui);
  }

  // Hàm này xoá toàn bộ bộ lọc giá.
  function xuLyXoaLoc() {
    capNhatGiaThapNhat("");
    capNhatGiaCaoNhat("");
    capNhatThongBaoLoi("");

    const duLieuGui = {
      giaThapNhat: undefined,
      giaCaoNhat: undefined,
    };

    thuocTinh.khiApDung(duLieuGui);
  }

  // Phần tử này hiển thị thông báo lỗi khi cần.
  let phanTuThongBaoLoi = null;

  // Chỉ tạo thông báo lỗi khi có nội dung lỗi.
  if (thongBaoLoi !== "") {
    phanTuThongBaoLoi = (
      <p className="price-filter__error" role="alert">
        {thongBaoLoi}
      </p>
    );
  }

  // Phần tử này hiển thị nút xoá lọc khi bộ lọc giá đang được dùng.
  let phanTuXoaLoc = null;

  // Chỉ tạo nút xoá lọc khi có bộ lọc giá đang hoạt động.
  if (coBoLocGiaDangDung === true) {
    phanTuXoaLoc = (
      <button className="filter-clear" type="button" onClick={xuLyXoaLoc}>
        Xoá lọc giá
      </button>
    );
  }

  return (
    <NhomBoLoc tieuDe="Giá" moBanDau={true}>
      <div className="price-range">
        <label className="sr-only" htmlFor="minimum-price">
          Giá thấp nhất
        </label>
        <input
          className="input"
          id="minimum-price"
          inputMode="numeric"
          placeholder="Từ"
          value={giaThapNhatDangNhap}
          onChange={xuLyThayDoiGiaThapNhat}
        />

        <label className="sr-only" htmlFor="maximum-price">
          Giá cao nhất
        </label>
        <input
          className="input"
          id="maximum-price"
          inputMode="numeric"
          placeholder="Đến"
          value={giaCaoNhatDangNhap}
          onChange={xuLyThayDoiGiaCaoNhat}
        />
      </div>

      {phanTuThongBaoLoi}

      <button
        className="btn btn--sm btn--block price-filter__apply"
        type="button"
        onClick={xuLyApDung}
      >
        Áp dụng
      </button>

      {phanTuXoaLoc}
    </NhomBoLoc>
  );
}
