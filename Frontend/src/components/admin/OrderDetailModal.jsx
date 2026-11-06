import {
  ImageOff,
  LoaderCircle,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import HopThoaiQuanTri from "./AdminModal";
import HuyHieuTrangThaiDonHang from "./OrderStatusBadge";
import { layThongBaoLoi, dinhDangNgayDayDu } from "../../lib/adminHelpers";
import { taoDuongDanTaiNguyen } from "../../lib/assetUrl";
import { dinhDangTien } from "../../lib/formatMoney";
import {
  layNhanPhuongThucThanhToan,
  taoChuoiThuocTinh,
} from "../../lib/orderFormat";

// Hàm này đọc một trường của địa chỉ và trả về chuỗi an toàn để hiển thị.
function layGiaTriDiaChi(diaChi, tenTruong) {
  if (diaChi === null) {
    return "—";
  }

  if (diaChi === undefined) {
    return "—";
  }

  const giaTri = diaChi[tenTruong];

  if (typeof giaTri !== "string") {
    return "—";
  }

  if (giaTri === "") {
    return "—";
  }

  return giaTri;
}

// Thành phần này hiển thị chi tiết một đơn hàng trong hộp thoại.
export default function ChiTietDonHangQuanTri(thuocTinh) {
  const donHang = thuocTinh.order;

  // Biến này lưu tiêu đề của hộp thoại.
  let tieuDe = "Chi tiết đơn hàng";

  if (thuocTinh.title !== undefined) {
    tieuDe = thuocTinh.title;
  }

  // Phần tử này hiển thị trạng thái đang tải chi tiết đơn.
  let phanTuDangTai = null;

  if (thuocTinh.isLoading === true) {
    phanTuDangTai = (
      <div className="admin-state admin-state--compact">
        <LoaderCircle className="spin" size={22} />
        <span>Đang tải chi tiết đơn…</span>
      </div>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được chi tiết đơn.
  let phanTuLoi = null;

  if (thuocTinh.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <span>
          {layThongBaoLoi(
            thuocTinh.error,
            "Không tải được chi tiết đơn hàng.",
          )}
        </span>
      </div>
    );
  }

  // Phần tử này hiển thị nội dung chi tiết khi đã có dữ liệu.
  let phanTuChiTiet = null;

  if (donHang !== null) {
    if (donHang !== undefined) {
      // Mảng này lưu giao diện của từng mặt hàng trong đơn.
      const cacMatHang = [];

      if (donHang.items !== null) {
        if (donHang.items !== undefined) {
          for (const matHang of donHang.items) {
            // Biến này lưu đường dẫn ảnh của mặt hàng.
            const duongDanAnh = taoDuongDanTaiNguyen(
              matHang.thumbnailUrl,
            );

            // Biến này lưu phần ảnh hoặc biểu tượng thay thế.
            let phanTuAnh = (
              <span className="product-media__fallback">
                <ImageOff size={18} />
              </span>
            );

            if (duongDanAnh !== null) {
              phanTuAnh = <img src={duongDanAnh} alt="" />;
            }

            // Biến này lưu chuỗi thuộc tính của mặt hàng.
            const chuoiThuocTinh = taoChuoiThuocTinh(
              matHang.attributes,
            );

            // Phần tử này hiển thị thuộc tính nếu mặt hàng có thuộc tính.
            let phanTuThuocTinh = null;

            if (chuoiThuocTinh !== "") {
              phanTuThuocTinh = (
                <small className="order-item__meta">
                  {chuoiThuocTinh}
                </small>
              );
            }

            cacMatHang.push(
              <div className="order-item" key={matHang.id}>
                <span className="order-item__media">{phanTuAnh}</span>
                <div>
                  <span className="order-item__name">
                    {matHang.productName}
                  </span>
                  <small className="order-item__meta">
                    {dinhDangTien(matHang.unitPriceMinor)} ×{" "}
                    {matHang.quantity}
                  </small>
                  {phanTuThuocTinh}
                </div>
                <span className="order-item__price">
                  {dinhDangTien(matHang.subtotalMinor)}
                </span>
              </div>,
            );
          }
        }
      }

      phanTuChiTiet = (
        <>
          <div className="admin-order-head">
            <div>
              <h3>Đơn #{donHang.id}</h3>
              <p className="cell-sub">
                Đặt lúc {dinhDangNgayDayDu(donHang.createdAt)}
              </p>
            </div>
            <HuyHieuTrangThaiDonHang status={donHang.status} />
          </div>

          <dl className="info-list">
            <div className="info-list__row">
              <dt>Người mua</dt>
              <dd>{donHang.buyerName}</dd>
            </div>
            <div className="info-list__row">
              <dt>Email</dt>
              <dd>{donHang.buyerEmail}</dd>
            </div>
            <div className="info-list__row">
              <dt>Thanh toán</dt>
              <dd>
                {layNhanPhuongThucThanhToan(donHang.paymentMethod)}
              </dd>
            </div>
            <div className="info-list__row">
              <dt>Cập nhật gần nhất</dt>
              <dd>{dinhDangNgayDayDu(donHang.updatedAt)}</dd>
            </div>
            <div className="info-list__row">
              <dt>Phiên checkout</dt>
              <dd>#{donHang.checkoutSessionId}</dd>
            </div>
          </dl>

          <h3 className="admin-order-title">Địa chỉ nhận hàng</h3>
          <div className="admin-address">
            <div>
              <User size={15} className="icon icon--sm" />
              <span>
                {layGiaTriDiaChi(
                  donHang.shippingAddress,
                  "recipientName",
                )}
              </span>
            </div>
            <div>
              <Phone size={15} className="icon icon--sm" />
              <span>
                {layGiaTriDiaChi(donHang.shippingAddress, "phone")}
              </span>
            </div>
            <div>
              <MapPin size={15} className="icon icon--sm" />
              <span>
                {layGiaTriDiaChi(
                  donHang.shippingAddress,
                  "fullAddress",
                )}
              </span>
            </div>
          </div>

          <h3 className="admin-order-title">
            Sản phẩm ({cacMatHang.length})
          </h3>
          <div className="admin-order-items">{cacMatHang}</div>

          <div className="summary__rows admin-order-totals">
            <div className="summary__row">
              <span>Tạm tính</span>
              <span>{dinhDangTien(donHang.subtotalMinor)}</span>
            </div>
            <div className="summary__row">
              <span>Phí vận chuyển</span>
              <span>{dinhDangTien(donHang.shippingFeeMinor)}</span>
            </div>
            <div className="summary__row summary__row--total">
              <span>Tổng cộng</span>
              <strong>{dinhDangTien(donHang.totalMinor)}</strong>
            </div>
          </div>
        </>
      );
    }
  }

  return (
    <HopThoaiQuanTri
      title={tieuDe}
      onClose={thuocTinh.onClose}
      width={680}
      footer={thuocTinh.footer}
    >
      {thuocTinh.notice}
      {phanTuDangTai}
      {phanTuLoi}
      {phanTuChiTiet}
    </HopThoaiQuanTri>
  );
}
