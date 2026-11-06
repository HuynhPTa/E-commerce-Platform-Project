import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ImageOff,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  capNhatSoLuongMatHang,
  xoaMatHangKhoiGio,
} from "../api/cartApi.js";
import { useAuth } from "../hooks/useAuth.js";
import { useGioHang } from "../hooks/useCart.js";
import { taoDuongDanTaiNguyen } from "../lib/assetUrl.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import { dinhDangTien } from "../lib/formatMoney.js";
import { NGUONG_MIEN_PHI_GIAO_HANG } from "../lib/shipping.js";

// Tiêu đề mặc định của tài liệu khi rời trang giỏ hàng.
const TIEU_DE_MAC_DINH = "Tất cả sản phẩm | MarketHub";

// Bảng này đổi tên thuộc tính kỹ thuật sang nhãn tiếng Việt dễ đọc.
const BANG_NHAN_THUOC_TINH = {
  color: "Màu",
  size: "Kích thước",
  layout: "Bố cục",
  switch: "Loại switch",
  set: "Bộ",
  "loại": "Loại",
};

// Hàm này trả về nhãn tiếng Việt của một thuộc tính phiên bản.
// Nếu chưa có nhãn phù hợp thì giữ nguyên tên thuộc tính.
function taoNhanThuocTinh(khoaThuocTinh) {
  const nhanDaBiet = BANG_NHAN_THUOC_TINH[khoaThuocTinh];

  if (nhanDaBiet !== undefined) {
    return nhanDaBiet;
  }

  return khoaThuocTinh;
}

// Hàm này ghép các thuộc tính của phiên bản thành một chuỗi dễ đọc.
function taoChuoiThuocTinh(thuocTinhPhienBan) {
  if (thuocTinhPhienBan === undefined) {
    return "";
  }

  if (thuocTinhPhienBan === null) {
    return "";
  }

  const cacCapThuocTinh = Object.entries(thuocTinhPhienBan);
  const cacPhan = [];

  for (const capThuocTinh of cacCapThuocTinh) {
    const khoaThuocTinh = capThuocTinh[0];
    const giaTriThuocTinh = capThuocTinh[1];
    const nhanThuocTinh = taoNhanThuocTinh(khoaThuocTinh);
    cacPhan.push(nhanThuocTinh + ": " + giaTriThuocTinh);
  }

  return cacPhan.join(" · ");
}

// Hàm này tính thành tiền của một dòng hàng trong giỏ.
function tinhTienMotDong(matHang) {
  const donGia = Number(matHang.unitPriceMinor);
  const soLuong = Number(matHang.quantity);

  if (Number.isFinite(donGia) === false) {
    return 0;
  }

  if (Number.isFinite(soLuong) === false) {
    return 0;
  }

  return donGia * soLuong;
}

// Hàm này tính tổng số sản phẩm trong giỏ, gồm cả số lượng của từng dòng.
function tinhTongSoLuong(danhSachMatHang) {
  let tongSoLuong = 0;

  for (const matHang of danhSachMatHang) {
    const soLuong = Number(matHang.quantity);

    if (Number.isFinite(soLuong) === true) {
      tongSoLuong += soLuong;
    }
  }

  return tongSoLuong;
}

// Hàm này tính tạm tính của toàn bộ giỏ hàng.
function tinhTamTinh(danhSachMatHang) {
  let tamTinh = 0;

  for (const matHang of danhSachMatHang) {
    tamTinh += tinhTienMotDong(matHang);
  }

  return tamTinh;
}

// Hàm này tính phần trăm tiến độ miễn phí giao hàng.
function tinhPhanTramMienPhiGiaoHang(tamTinh) {
  if (tamTinh <= 0) {
    return 0;
  }

  if (tamTinh >= NGUONG_MIEN_PHI_GIAO_HANG) {
    return 100;
  }

  const phanTram = (tamTinh / NGUONG_MIEN_PHI_GIAO_HANG) * 100;

  return Math.round(phanTram);
}

// Hàm này kiểm tra lỗi trả về có phải do phiên đăng nhập đã hết hạn hay không.
function kiemTraLaLoiHetPhien(loi) {
  if (loi === undefined) {
    return false;
  }

  if (loi === null) {
    return false;
  }

  if (loi.response !== undefined) {
    if (loi.response !== null) {
      if (loi.response.status === 401) {
        return true;
      }
    }
  }

  return false;
}

// Hàm này đưa số lượng người dùng nhập về khoảng hợp lệ của sản phẩm.
function chuanHoaSoLuong(giaTriNhap, soLuongToiDa) {
  let soLuong = Number.parseInt(giaTriNhap, 10);

  if (Number.isFinite(soLuong) === false) {
    soLuong = 1;
  }

  if (soLuong < 1) {
    soLuong = 1;
  }

  let gioiHanTren = soLuongToiDa;

  if (gioiHanTren < 1) {
    gioiHanTren = 1;
  }

  if (soLuong > gioiHanTren) {
    soLuong = gioiHanTren;
  }

  return soLuong;
}

// Thành phần này hiển thị một dòng sản phẩm trong giỏ hàng.
function DongGioHang(thuocTinh) {
  // Biến này lưu dữ liệu mặt hàng do thành phần cha truyền xuống.
  const matHang = thuocTinh.matHang;

  // Biến này cho biết mặt hàng đang được chọn để thanh toán hay không.
  const duocChon = thuocTinh.duocChon;

  // Hàm này báo cho trang giỏ hàng biết người dùng vừa đổi lựa chọn.
  function xuLyDoiChon(suKienDoi) {
    thuocTinh.khiChon(matHang.id, suKienDoi.target.checked);
  }

  // useState tạo giá trị số lượng đang nhập trên ô số lượng.
  const trangThaiSoLuongNhap = useState(String(matHang.quantity));

  // Biến này lưu nội dung số lượng đang nhập.
  const soLuongNhap = trangThaiSoLuongNhap[0];

  // Biến này lưu hàm cập nhật nội dung số lượng đang nhập.
  const capNhatSoLuongNhap = trangThaiSoLuongNhap[1];

  // useState tạo trạng thái cho biết ảnh sản phẩm có bị lỗi tải hay không.
  const trangThaiLoiAnh = useState(false);

  // Biến này cho biết ảnh sản phẩm đang bị lỗi hay không.
  const coLoiAnh = trangThaiLoiAnh[0];

  // Biến này lưu hàm cập nhật trạng thái lỗi ảnh.
  const capNhatCoLoiAnh = trangThaiLoiAnh[1];

  // useMutation tạo thao tác cập nhật số lượng của dòng hàng này.
  const thaoTacCapNhat = useMutation({
    mutationFn: capNhatSoLuongMatHang,
  });

  // useRef chặn hai lần gửi số lượng chồng nhau trong cùng một thời điểm.
  const thamChieuDangGuiSoLuong = useRef(false);

  // Hàm này đồng bộ ô số lượng khi dữ liệu giỏ hàng thay đổi.
  function dongBoSoLuongNhap() {
    capNhatSoLuongNhap(String(matHang.quantity));
  }

  // useEffect chạy hàm đồng bộ mỗi khi số lượng thật của mặt hàng thay đổi.
  useEffect(dongBoSoLuongNhap, [matHang.quantity, capNhatSoLuongNhap]);

  // Hàm này đánh dấu ảnh sản phẩm đã bị lỗi tải.
  function xuLyLoiAnh() {
    capNhatCoLoiAnh(true);
  }

  // Biến này lưu đường dẫn đầy đủ của ảnh sản phẩm.
  const duongDanAnhSanPham = taoDuongDanTaiNguyen(matHang.thumbnailUrl);

  // Phần tử này hiển thị ảnh sản phẩm hoặc biểu tượng thay thế.
  let phanTuAnhSanPham = null;

  // Chỉ hiển thị ảnh khi có đường dẫn và ảnh chưa bị lỗi.
  if (duongDanAnhSanPham !== null) {
    if (coLoiAnh === false) {
      phanTuAnhSanPham = (
        <img
          src={duongDanAnhSanPham}
          alt={matHang.productName}
          loading="lazy"
          onError={xuLyLoiAnh}
        />
      );
    }
  }

  // Nếu không có ảnh dùng được thì hiển thị biểu tượng thay thế.
  if (phanTuAnhSanPham === null) {
    phanTuAnhSanPham = (
      <span className="product-media__fallback">
        <ImageOff size={28} />
      </span>
    );
  }

  // Hàm này báo cho trang giỏ hàng biết cập nhật số lượng đã thành công.
  function xuLyCapNhatThanhCong() {
    thamChieuDangGuiSoLuong.current = false;
    thuocTinh.khiCapNhatThanhCong();
  }

  // Hàm này đưa ô số lượng về giá trị cũ và báo lỗi cho trang giỏ hàng.
  function xuLyCapNhatThatBai(loi) {
    thamChieuDangGuiSoLuong.current = false;
    capNhatSoLuongNhap(String(matHang.quantity));
    thuocTinh.khiBaoLoi(loi);
  }

  // Hàm này gửi số lượng mới lên backend nếu số lượng thực sự thay đổi.
  function guiSoLuongMoi(soLuongMoi) {
    // Bỏ qua nếu một yêu cầu cập nhật khác đang chạy.
    if (thamChieuDangGuiSoLuong.current === true) {
      return;
    }

    if (soLuongMoi === matHang.quantity) {
      return;
    }

    const duLieuGui = {
      itemId: matHang.id,
      quantity: soLuongMoi,
    };

    const tuyChonThaoTac = {
      onSuccess: xuLyCapNhatThanhCong,
      onError: xuLyCapNhatThatBai,
    };

    thamChieuDangGuiSoLuong.current = true;
    thaoTacCapNhat.mutate(duLieuGui, tuyChonThaoTac);
  }

  // Hàm này giảm số lượng sản phẩm xuống một đơn vị.
  function xuLyGiamSoLuong() {
    const soLuongHienTai = chuanHoaSoLuong(
      soLuongNhap,
      matHang.stockQuantity,
    );

    let soLuongMoi = soLuongHienTai - 1;

    if (soLuongMoi < 1) {
      soLuongMoi = 1;
    }

    capNhatSoLuongNhap(String(soLuongMoi));
    guiSoLuongMoi(soLuongMoi);
  }

  // Hàm này tăng số lượng sản phẩm lên một đơn vị.
  function xuLyTangSoLuong() {
    const soLuongHienTai = chuanHoaSoLuong(
      soLuongNhap,
      matHang.stockQuantity,
    );

    let soLuongMoi = soLuongHienTai + 1;

    if (soLuongMoi > matHang.stockQuantity) {
      soLuongMoi = matHang.stockQuantity;
    }

    capNhatSoLuongNhap(String(soLuongMoi));
    guiSoLuongMoi(soLuongMoi);
  }

  // Hàm này cập nhật nội dung ô số lượng khi người dùng gõ.
  function xuLyNhapSoLuong(suKienNhap) {
    capNhatSoLuongNhap(suKienNhap.target.value);
  }

  // Hàm này chốt số lượng khi người dùng rời khỏi ô nhập.
  function xuLyChotSoLuong() {
    const soLuongMoi = chuanHoaSoLuong(
      soLuongNhap,
      matHang.stockQuantity,
    );

    capNhatSoLuongNhap(String(soLuongMoi));
    guiSoLuongMoi(soLuongMoi);
  }

  // Hàm này chốt số lượng khi người dùng bấm phím Enter.
  function xuLyNhanPhim(suKienPhim) {
    if (suKienPhim.key === "Enter") {
      xuLyChotSoLuong();
      suKienPhim.currentTarget.blur();
    }
  }

  // Hàm này chuyển yêu cầu xoá mặt hàng lên trang giỏ hàng.
  function xuLyXoaMatHang() {
    thuocTinh.khiXoa(matHang);
  }

  // Biến này cho biết nút giảm số lượng có bị khoá hay không.
  let nutGiamBiKhoa = false;

  if (thaoTacCapNhat.isPending === true) {
    nutGiamBiKhoa = true;
  }

  if (matHang.quantity <= 1) {
    nutGiamBiKhoa = true;
  }

  // Biến này cho biết nút tăng số lượng có bị khoá hay không.
  let nutTangBiKhoa = false;

  if (thaoTacCapNhat.isPending === true) {
    nutTangBiKhoa = true;
  }

  if (matHang.quantity >= matHang.stockQuantity) {
    nutTangBiKhoa = true;
  }

  // Biến này cho biết nút xoá có bị khoá hay không.
  let nutXoaBiKhoa = false;

  if (thuocTinh.dangXoa === true) {
    nutXoaBiKhoa = true;
  }

  // Biến này lưu đường dẫn tới trang chi tiết sản phẩm.
  const duongDanChiTietSanPham = "/products/" + matHang.productId;

  // Biến này lưu chuỗi thuộc tính của phiên bản đang có trong giỏ.
  const chuoiThuocTinh = taoChuoiThuocTinh(matHang.attributes);

  // Phần tử này hiển thị thuộc tính phiên bản nếu có dữ liệu.
  let phanTuThuocTinh = null;

  if (chuoiThuocTinh !== "") {
    phanTuThuocTinh = (
      <span className="cart-line__variant">{chuoiThuocTinh}</span>
    );
  }

  // Biến này lưu mã của ô nhập số lượng để nối với nhãn truy cập.
  const maOSoLuong = "cart-quantity-" + matHang.id;

  return (
    <article className="cart-line">
      <label className="cart-line__select">
        <input
          type="checkbox"
          checked={duocChon}
          onChange={xuLyDoiChon}
          aria-label={"Chọn " + matHang.productName}
        />
      </label>

      <Link
        className="cart-line__media"
        to={duongDanChiTietSanPham}
        aria-label={matHang.productName}
      >
        {phanTuAnhSanPham}
      </Link>

      <div className="cart-line__body">
        <Link className="cart-line__name" to={duongDanChiTietSanPham}>
          {matHang.productName}
        </Link>
        {phanTuThuocTinh}
        <div className="cart-line__controls">
          <div className="qty">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={xuLyGiamSoLuong}
              disabled={nutGiamBiKhoa}
            >
              <Minus className="icon icon--sm" />
            </button>
            <label className="sr-only" htmlFor={maOSoLuong}>
              Số lượng
            </label>
            <input
              id={maOSoLuong}
              type="number"
              value={soLuongNhap}
              min="1"
              max={matHang.stockQuantity}
              inputMode="numeric"
              onChange={xuLyNhapSoLuong}
              onBlur={xuLyChotSoLuong}
              onKeyDown={xuLyNhanPhim}
            />
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={xuLyTangSoLuong}
              disabled={nutTangBiKhoa}
            >
              <Plus className="icon icon--sm" />
            </button>
          </div>
          <button
            className="cart-line__remove"
            type="button"
            onClick={xuLyXoaMatHang}
            disabled={nutXoaBiKhoa}
          >
            Xoá
          </button>
        </div>
      </div>

      <div className="cart-line__price">
        {dinhDangTien(tinhTienMotDong(matHang))}
        <span className="cart-line__each">
          {dinhDangTien(matHang.unitPriceMinor)} / sản phẩm
        </span>
      </div>
    </article>
  );
}

// Thành phần này hiển thị trang giỏ hàng của cửa hàng.
export default function TrangGioHang() {
  // useAuth trả về trạng thái đăng nhập hiện tại.
  const trangThaiDangNhap = useAuth();

  // Biến này cho biết người dùng đã đăng nhập hay chưa.
  const daDangNhap = trangThaiDangNhap.daDangNhap;

  // Hook này gọi API lấy giỏ hàng khi người dùng đã đăng nhập.
  const ketQuaGioHang = useGioHang(daDangNhap);

  // useQueryClient trả về bộ quản lý truy vấn để làm mới dữ liệu giỏ hàng.
  const boQuanLyTruyVan = useQueryClient();

  // useMutation tạo thao tác xoá mặt hàng khỏi giỏ hàng.
  const thaoTacXoa = useMutation({
    mutationFn: xoaMatHangKhoiGio,
  });

  // useState tạo nội dung thông báo hiển thị ở góc trang.
  const trangThaiThongBao = useState("");

  // Biến này lưu nội dung thông báo hiện tại.
  const thongBao = trangThaiThongBao[0];

  // Biến này lưu hàm cập nhật nội dung thông báo.
  const capNhatThongBao = trangThaiThongBao[1];

  // useState lưu danh sách mã mặt hàng đang được chọn để thanh toán.
  const trangThaiMaDaChon = useState([]);

  // Biến này lưu danh sách mã mặt hàng đang được chọn.
  const cacMaDaChon = trangThaiMaDaChon[0];

  // Biến này lưu hàm cập nhật danh sách mã mặt hàng đang chọn.
  const capNhatCacMaDaChon = trangThaiMaDaChon[1];

  // useRef lưu mã hẹn giờ mà không gây render lại thành phần.
  const thamChieuHenGio = useRef();

  // Hàm này xoá hẹn giờ còn treo khi thành phần bị gỡ khỏi giao diện.
  function xuLyDonDepHenGio() {
    const maHenGio = thamChieuHenGio.current;

    if (maHenGio !== undefined) {
      window.clearTimeout(maHenGio);
    }
  }

  // useEffect chạy hàm dọn dẹp sau khi thành phần được gắn vào giao diện.
  useEffect(xuLyDonDepHenGio, []);

  // Hàm này hiển thị thông báo và tự ẩn sau ba giây.
  function hienThiThongBao(noiDungThongBao) {
    capNhatThongBao(noiDungThongBao);

    const maHenGioCu = thamChieuHenGio.current;

    // Nếu đang có hẹn giờ cũ thì huỷ trước khi tạo hẹn giờ mới.
    if (maHenGioCu !== undefined) {
      window.clearTimeout(maHenGioCu);
    }

    // Hàm này xoá nội dung thông báo sau khi hết thời gian.
    function xoaThongBao() {
      capNhatThongBao("");
    }

    thamChieuHenGio.current = window.setTimeout(xoaThongBao, 3000);
  }

  // Hàm này cập nhật tiêu đề tài liệu khi mở trang giỏ hàng.
  function xuLyCapNhatTieuDeTaiLieu() {
    document.title = "Giỏ hàng | MarketHub";

    // Hàm này khôi phục tiêu đề mặc định khi rời trang.
    function xuLyKhoiPhucTieuDe() {
      document.title = TIEU_DE_MAC_DINH;
    }

    return xuLyKhoiPhucTieuDe;
  }

  // useEffect cập nhật tiêu đề tài liệu sau khi trang được gắn vào giao diện.
  useEffect(xuLyCapNhatTieuDeTaiLieu, []);

  // Hàm này làm mới dữ liệu giỏ hàng sau khi cập nhật số lượng thành công.
  function xuLyCapNhatThanhCong() {
    boQuanLyTruyVan.invalidateQueries({ queryKey: ["cart"] });
  }

  // Hàm này hiển thị lỗi khi cập nhật số lượng thất bại.
  function xuLyBaoLoiCapNhat(loi) {
    const thongDiepMacDinh =
      "Không cập nhật được số lượng. Vui lòng thử lại.";
    const thongDiepLoi = layThongDiepLoiBackend(loi, thongDiepMacDinh);
    hienThiThongBao(thongDiepLoi);
  }

  // Hàm này xoá một mặt hàng khỏi giỏ hàng.
  function xuLyXoaMatHang(matHang) {
    // Hàm này xử lý khi xoá mặt hàng thành công.
    function xuLyXoaThanhCong() {
      boQuanLyTruyVan.invalidateQueries({ queryKey: ["cart"] });
      hienThiThongBao(
        'Đã xoá "' + matHang.productName + '" khỏi giỏ hàng.',
      );
    }

    // Hàm này hiển thị lỗi khi xoá mặt hàng thất bại.
    function xuLyXoaThatBai(loi) {
      const thongDiepMacDinh =
        "Không xoá được sản phẩm. Vui lòng thử lại.";
      const thongDiepLoi = layThongDiepLoiBackend(loi, thongDiepMacDinh);
      hienThiThongBao(thongDiepLoi);
    }

    const tuyChonThaoTac = {
      onSuccess: xuLyXoaThanhCong,
      onError: xuLyXoaThatBai,
    };

    thaoTacXoa.mutate(matHang.id, tuyChonThaoTac);
  }

  // Hàm này thêm hoặc bỏ một mặt hàng khỏi danh sách đang chọn.
  function xuLyChonMatHang(maMatHang, duocChon) {
    // Mảng này lưu danh sách mã mới sau khi thay đổi.
    const danhSachMoi = [];

    for (const maDangCo of cacMaDaChon) {
      if (maDangCo !== maMatHang) {
        danhSachMoi.push(maDangCo);
      }
    }

    if (duocChon === true) {
      danhSachMoi.push(maMatHang);
    }

    capNhatCacMaDaChon(danhSachMoi);
  }

  // Hàm này chọn hoặc bỏ chọn toàn bộ mặt hàng trong giỏ.
  function xuLyChonTatCa(suKienDoi) {
    if (suKienDoi.target.checked === true) {
      const danhSachMoi = [];

      for (const matHang of danhSachMatHang) {
        danhSachMoi.push(matHang.id);
      }

      capNhatCacMaDaChon(danhSachMoi);
      return;
    }

    capNhatCacMaDaChon([]);
  }

  // Hàm này gọi lại API giỏ hàng khi người dùng bấm thử lại.
  function xuLyThuLai() {
    ketQuaGioHang.refetch();
  }

  // Biến này lưu danh sách mặt hàng sau khi kiểm tra dữ liệu trả về.
  let danhSachMatHang = [];

  const duLieuGioHang = ketQuaGioHang.data;

  // Nếu dữ liệu trả về là một mảng thì mới dùng được.
  if (Array.isArray(duLieuGioHang) === true) {
    danhSachMatHang = duLieuGioHang;
  }

  // Biến này lưu tổng số sản phẩm trong giỏ.
  const tongSoLuong = tinhTongSoLuong(danhSachMatHang);

  // Mảng này lưu các mặt hàng đang được chọn để thanh toán.
  const danhSachDaChon = [];

  for (const matHang of danhSachMatHang) {
    if (cacMaDaChon.includes(matHang.id) === true) {
      danhSachDaChon.push(matHang);
    }
  }

  // Biến này lưu tổng số lượng sản phẩm đang được chọn.
  const soLuongDaChon = tinhTongSoLuong(danhSachDaChon);

  // Biến này lưu tạm tính của các mặt hàng đang được chọn.
  const tamTinhDaChon = tinhTamTinh(danhSachDaChon);

  // Biến này cho biết toàn bộ mặt hàng trong giỏ đang được chọn hay không.
  let dangChonTatCa = false;

  if (danhSachMatHang.length > 0) {
    if (danhSachDaChon.length === danhSachMatHang.length) {
      dangChonTatCa = true;
    }
  }

  // Biến này lưu mô tả ngắn hiển thị dưới tiêu đề trang.
  let moTaTrang = "Đăng nhập để xem giỏ hàng của bạn.";

  // Nếu đã đăng nhập thì hiển thị số sản phẩm hiện có.
  if (daDangNhap === true) {
    moTaTrang =
      tongSoLuong + " sản phẩm · Cùng một cửa hàng, một lần giao.";
  }

  // Nếu giỏ hàng đang tải thì hiển thị trạng thái tải.
  if (ketQuaGioHang.isLoading === true) {
    moTaTrang = "Đang tải giỏ hàng…";
  }

  // Nếu đã tải xong mà giỏ hàng trống thì mô tả đúng trạng thái.
  if (ketQuaGioHang.isLoading === false) {
    if (daDangNhap === true) {
      if (ketQuaGioHang.isError === false) {
        if (danhSachMatHang.length === 0) {
          moTaTrang = "Giỏ hàng của bạn đang trống.";
        }
      }
    }
  }

  // Nếu tải giỏ hàng bị lỗi thì mô tả đúng trạng thái.
  if (ketQuaGioHang.isError === true) {
    moTaTrang = "Không tải được giỏ hàng.";
  }

  // Phần tử này hiển thị nội dung chính theo trạng thái của giỏ hàng.
  let noiDungChinh;

  // Nếu chưa đăng nhập thì yêu cầu đăng nhập trước khi xem giỏ hàng.
  if (daDangNhap === false) {
    noiDungChinh = (
      <div className="catalog-state">
        <h2>Đăng nhập để xem giỏ hàng</h2>
        <p>Giỏ hàng của bạn được lưu theo tài khoản MarketHub.</p>
        <Link className="btn btn--primary" to="/login?redirect=/cart">
          Đăng nhập
        </Link>
      </div>
    );
  } else if (ketQuaGioHang.isLoading === true) {
    noiDungChinh = (
      <div className="catalog-state" role="status">
        <h2>Đang tải giỏ hàng…</h2>
        <p>Dữ liệu đang được lấy từ MarketHub.</p>
      </div>
    );
  } else if (ketQuaGioHang.isError === true) {
    // Biến này cho biết lỗi có phải do phiên đăng nhập đã hết hạn hay không.
    const laLoiHetPhien = kiemTraLaLoiHetPhien(ketQuaGioHang.error);

    // Biến này lưu tiêu đề của trạng thái lỗi.
    let tieuDeLoi = "Không tải được giỏ hàng";

    // Biến này lưu mô tả của trạng thái lỗi.
    let moTaLoi = "Kiểm tra backend và MySQL đang chạy, sau đó thử lại.";

    // Phần tử này hiển thị hành động phù hợp với loại lỗi.
    let phanTuHanhDong = (
      <button className="btn" type="button" onClick={xuLyThuLai}>
        Thử lại
      </button>
    );

    // Nếu phiên đăng nhập hết hạn thì mời người dùng đăng nhập lại.
    if (laLoiHetPhien === true) {
      tieuDeLoi = "Phiên đăng nhập đã hết hạn";
      moTaLoi = "Vui lòng đăng nhập lại để xem giỏ hàng.";

      phanTuHanhDong = (
        <Link className="btn btn--primary" to="/login?redirect=/cart">
          Đăng nhập lại
        </Link>
      );
    }

    noiDungChinh = (
      <div className="catalog-state" role="alert">
        <h2>{tieuDeLoi}</h2>
        <p>{moTaLoi}</p>
        {phanTuHanhDong}
      </div>
    );
  } else if (danhSachMatHang.length === 0) {
    noiDungChinh = (
      <div className="catalog-state">
        <h2>Giỏ hàng đang trống</h2>
        <p>Thêm sản phẩm yêu thích để tiếp tục thanh toán.</p>
        <Link className="btn btn--primary" to="/products">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  } else {
    // Mảng này lưu các dòng sản phẩm sẽ hiển thị trong giỏ.
    const cacDongGioHang = [];

    for (const matHang of danhSachMatHang) {
      // Biến này cho biết dòng hiện tại có đang được chọn hay không.
      let duocChon = false;

      if (cacMaDaChon.includes(matHang.id) === true) {
        duocChon = true;
      }

      cacDongGioHang.push(
        <DongGioHang
          key={matHang.id}
          matHang={matHang}
          duocChon={duocChon}
          dangXoa={thaoTacXoa.isPending}
          khiXoa={xuLyXoaMatHang}
          khiChon={xuLyChonMatHang}
          khiCapNhatThanhCong={xuLyCapNhatThanhCong}
          khiBaoLoi={xuLyBaoLoiCapNhat}
        />,
      );
    }

    // Mảng này lưu mã của các mặt hàng đang được chọn và còn tồn tại.
    const cacMaDaChonHopLe = [];

    for (const matHang of danhSachDaChon) {
      cacMaDaChonHopLe.push(matHang.id);
    }

    // Biến này lưu phần trăm tiến độ miễn phí giao hàng của phần đang chọn.
    const phanTramMienPhi = tinhPhanTramMienPhiGiaoHang(tamTinhDaChon);

    // Biến này lưu lời nhắc về ưu đãi giao hàng.
    let loiNhacGiaoHang = "Chọn sản phẩm để xem ưu đãi giao hàng.";

    if (tamTinhDaChon > 0) {
      if (tamTinhDaChon >= NGUONG_MIEN_PHI_GIAO_HANG) {
        loiNhacGiaoHang =
          "Đơn đã chọn được miễn phí giao hàng toàn quốc.";
      }

      if (tamTinhDaChon < NGUONG_MIEN_PHI_GIAO_HANG) {
        const soTienConThieu = NGUONG_MIEN_PHI_GIAO_HANG - tamTinhDaChon;
        loiNhacGiaoHang =
          "Mua thêm " +
          dinhDangTien(soTienConThieu) +
          " để được miễn phí giao hàng.";
      }
    }

    // Biến này lưu nhãn phí giao hàng tạm thời trong giỏ.
    let nhanPhiGiaoHang = "Tính ở bước thanh toán";

    if (tamTinhDaChon >= NGUONG_MIEN_PHI_GIAO_HANG) {
      nhanPhiGiaoHang = "Miễn phí";
    }

    if (tamTinhDaChon > 0) {
      if (tamTinhDaChon < NGUONG_MIEN_PHI_GIAO_HANG) {
        nhanPhiGiaoHang = "Từ 0₫ tùy khu vực";
      }
    }

    // Phần tử này hiển thị nút thanh toán khi đã chọn ít nhất một món.
    let phanTuThanhToan = (
      <button className="btn btn--primary btn--block" type="button" disabled>
        Chọn sản phẩm để thanh toán
      </button>
    );

    if (danhSachDaChon.length > 0) {
      const duongDanThanhToan =
        "/checkout?cartItemIds=" + cacMaDaChonHopLe.join(",");

      phanTuThanhToan = (
        <Link className="btn btn--primary btn--block" to={duongDanThanhToan}>
          Thanh toán {soLuongDaChon} sản phẩm{" "}
          <ArrowRight className="icon icon--sm" />
        </Link>
      );
    }

    noiDungChinh = (
      <div className="cart-layout">
        <div>
          <div className="cart-select-bar">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={dangChonTatCa}
                onChange={xuLyChonTatCa}
              />
              <span>Chọn tất cả ({danhSachMatHang.length} sản phẩm)</span>
            </label>
            <span className="muted">Đã chọn {soLuongDaChon} sản phẩm</span>
          </div>

          <div className="cart-lines">{cacDongGioHang}</div>
          <p className="muted cart-note">
            Giá và tồn kho được kiểm tra lại khi bạn đặt hàng. Đơn dưới
            499.000₫ có phí giao hàng theo khu vực.
          </p>
        </div>

        <aside className="summary" aria-label="Tóm tắt đơn hàng">
          <h2>Tóm tắt</h2>

          <div className="ship-progress">
            <p>{loiNhacGiaoHang}</p>
            <div className="ship-progress__track">
              <div
                className="ship-progress__fill"
                style={{ width: phanTramMienPhi + "%" }}
              />
            </div>
          </div>

          <div className="summary__rows">
            <div className="summary__row">
              <span>Tạm tính ({soLuongDaChon} sản phẩm)</span>
              <span>{dinhDangTien(tamTinhDaChon)}</span>
            </div>
            <div className="summary__row">
              <span>Phí giao hàng</span>
              <span>{nhanPhiGiaoHang}</span>
            </div>
            <div className="summary__row summary__row--total">
              <span>Tổng tạm tính</span>
              <span>{dinhDangTien(tamTinhDaChon)}</span>
            </div>
          </div>

          {phanTuThanhToan}

          <p className="summary__note">
            <ShieldCheck className="icon icon--sm" />
            Thanh toán khi nhận hàng, VNPay hoặc MoMo. Giá đã bao gồm VAT.
          </p>
        </aside>
      </div>
    );
  }

  // Biến này lưu tên lớp của thông báo, có thêm lớp hiển thị khi có nội dung.
  let tenLopThongBao = "toast";

  if (thongBao !== "") {
    tenLopThongBao += " is-visible";
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Giỏ hàng</h1>
          <p>{moTaTrang}</p>
        </div>
        <div className="page-head__aside">
          <Link className="link" to="/products">
            Tiếp tục mua sắm <ArrowRight className="icon icon--sm" />
          </Link>
        </div>
      </div>

      {noiDungChinh}

      <div className={tenLopThongBao} role="status" aria-live="polite">
        {thongBao}
      </div>
    </div>
  );
}
