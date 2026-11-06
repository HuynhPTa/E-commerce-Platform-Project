import { useEffect } from "react";
import { X } from "lucide-react";

// Thành phần này hiển thị hộp thoại dùng chung cho storefront.
export default function HopThoai(thuocTinh) {
  const tieuDe = thuocTinh.title;
  const khiDong = thuocTinh.onClose;

  // Biến này lưu chiều rộng tối đa của hộp thoại.
  let doRong = 520;

  if (thuocTinh.width !== undefined) {
    doRong = thuocTinh.width;
  }

  useEffect(
    function () {
      // Hàm này đóng hộp thoại khi người dùng nhấn phím Escape.
      function xuLyPhimEscape(suKienBanPhim) {
        if (suKienBanPhim.key === "Escape") {
          khiDong();
        }
      }

      document.addEventListener("keydown", xuLyPhimEscape);
      document.body.style.overflow = "hidden";

      // Hàm dọn dẹp gỡ trình nghe và mở lại cuộn trang.
      return function () {
        document.removeEventListener("keydown", xuLyPhimEscape);
        document.body.style.overflow = "";
      };
    },
    [khiDong],
  );

  // Hàm này đóng hộp thoại khi người dùng bấm ra vùng nền.
  function xuLyBamNen(suKienBam) {
    if (suKienBam.target === suKienBam.currentTarget) {
      khiDong();
    }
  }

  // Phần tử này hiển thị phần chân hộp thoại nếu có.
  let phanTuChan = null;

  if (thuocTinh.footer !== undefined) {
    if (thuocTinh.footer !== null) {
      phanTuChan = <div className="modal__foot">{thuocTinh.footer}</div>;
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={xuLyBamNen}>
      <div
        className="modal"
        style={{ maxWidth: doRong }}
        role="dialog"
        aria-modal="true"
        aria-label={tieuDe}
      >
        <div className="modal__head">
          <h2>{tieuDe}</h2>
          <button
            className="modal__close"
            type="button"
            onClick={khiDong}
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{thuocTinh.children}</div>
        {phanTuChan}
      </div>
    </div>
  );
}
