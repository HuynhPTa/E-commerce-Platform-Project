import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  ClipboardList,
  LoaderCircle,
  Package,
  Plus,
  TriangleAlert,
  Truck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  useTongQuanQuanTri,
} from "../../hooks/useAdmin";
import OChiSoQuanTri from "../../components/admin/AdminStatCard";
import {
  CAC_TRANG_THAI_THONG_KE,
} from "../../components/admin/adminOrderStatus";
import HuyHieuTrangThaiDonHang from "../../components/admin/OrderStatusBadge";
import {
  dinhDangNgayDayDu,
  dinhDangPhanTramQuanTri,
  laySoLieuQuanTri,
} from "../../lib/adminHelpers";
import { dinhDangTien } from "../../lib/formatMoney";
import { layNhanTrangThaiDonHang } from "../../lib/orderFormat";

// Hàm này trả về màu của thanh thống kê theo trạng thái đơn hàng.
function layMauTrangThai(trangThai) {
  if (trangThai === "PENDING") {
    return "var(--amber)";
  }

  if (trangThai === "CONFIRMED") {
    return "var(--blue)";
  }

  if (trangThai === "CANCELLED") {
    return "var(--red)";
  }

  return "var(--green)";
}

// Thành phần này hiển thị trang tổng quan của khu vực quản trị.
export default function TrangTongQuanQuanTri() {
  const ketQuaTongQuan = useTongQuanQuanTri();

  if (ketQuaTongQuan.isLoading === true) {
    return (
      <div className="admin-state">
        <LoaderCircle className="spin" size={24} />
        <span>Đang tải tổng quan…</span>
      </div>
    );
  }

  if (ketQuaTongQuan.isError === true) {
    return (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>
          Không tải được số liệu tổng quan. Vui lòng thử lại.
        </div>
      </div>
    );
  }

  const duLieu = ketQuaTongQuan.data;

  // Biến này lưu tổng số đơn hàng để tính tỷ lệ phần trăm.
  let tongSoDon = 0;

  if (duLieu.totalOrders !== null) {
    if (duLieu.totalOrders !== undefined) {
      tongSoDon = duLieu.totalOrders;
    }
  }

  // Mảng này lưu giao diện các dòng thống kê theo trạng thái.
  const cacDongThongKe = [];

  for (const trangThai of CAC_TRANG_THAI_THONG_KE) {
    // Biến này lưu số đơn ở trạng thái hiện tại.
    let soDon = 0;

    if (duLieu.ordersByStatus !== null) {
      if (duLieu.ordersByStatus !== undefined) {
        const giaTriTrangThai = duLieu.ordersByStatus[trangThai];

        if (giaTriTrangThai !== null) {
          if (giaTriTrangThai !== undefined) {
            soDon = giaTriTrangThai;
          }
        }
      }
    }

    // Biến này lưu tỷ lệ phần trăm của trạng thái hiện tại.
    let phanTram = 0;

    if (tongSoDon > 0) {
      phanTram = Math.round((soDon / tongSoDon) * 100);
    }

    const mauThanh = layMauTrangThai(trangThai);
    const nhanTrangThai = layNhanTrangThaiDonHang(trangThai);

    cacDongThongKe.push(
      <div className="bar-row" key={trangThai}>
        <span className="bar-row__label">{nhanTrangThai}</span>
        <span className="bar-row__track">
          <span
            className="bar-row__fill"
            style={{ width: phanTram + "%", background: mauThanh }}
          />
        </span>
        <span className="bar-row__value">{soDon}</span>
      </div>,
    );
  }

  // Mảng này lưu giao diện các đơn hàng gần đây.
  const cacDonHangGanDay = [];

  if (Array.isArray(duLieu.recentOrders) === true) {
    for (const donHang of duLieu.recentOrders) {
      cacDonHangGanDay.push(
        <tr key={donHang.id}>
          <td>
            <strong>#{donHang.id}</strong>
            <div className="cell-sub">
              {dinhDangNgayDayDu(donHang.createdAt)}
            </div>
          </td>
          <td>
            {donHang.buyerName}
            <div className="cell-sub">{donHang.buyerEmail}</div>
          </td>
          <td className="num">{dinhDangTien(donHang.totalMinor)}</td>
          <td>
            <HuyHieuTrangThaiDonHang status={donHang.status} />
          </td>
        </tr>,
      );
    }
  }

  // Phần tử này hiển thị trạng thái chưa có đơn hàng.
  let phanTuChuaCoDon = null;

  if (cacDonHangGanDay.length === 0) {
    phanTuChuaCoDon = (
      <div className="admin-state admin-state--compact">
        <ClipboardList size={28} />
        <span>Chưa có đơn hàng nào.</span>
      </div>
    );
  }

  // Phần tử này hiển thị bảng đơn hàng gần đây khi có dữ liệu.
  let phanTuBangDonHang = null;

  if (cacDonHangGanDay.length > 0) {
    phanTuBangDonHang = (
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Người mua</th>
              <th className="num">Tổng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>{cacDonHangGanDay}</tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="panel__head">
        <div>
          <p className="eyebrow-free">Bảng điều khiển</p>
          <h1>Tổng quan cửa hàng</h1>
        </div>
        <div className="panel__head-actions">
          <Link className="btn btn--primary btn--sm" to="/admin/products/new">
            <Plus size={15} /> Thêm sản phẩm
          </Link>
          <Link className="btn btn--sm" to="/admin/orders">
            Xem đơn hàng
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <OChiSoQuanTri
          icon={Wallet}
          tone="var(--green)"
          value={dinhDangTien(duLieu.revenueMinor)}
          label="Doanh thu hoàn tất"
          meta={"Hôm nay: " + dinhDangTien(duLieu.todayRevenueMinor)}
        />
        <OChiSoQuanTri
          icon={CalendarDays}
          tone="var(--blue)"
          value={laySoLieuQuanTri(duLieu.todayOrders)}
          label="Đơn hôm nay"
          meta={"Tổng " + laySoLieuQuanTri(duLieu.totalOrders) + " đơn"}
        />
        <OChiSoQuanTri
          icon={Clock}
          tone="var(--amber)"
          value={laySoLieuQuanTri(duLieu.pendingOrders)}
          label="Chờ xác nhận"
          meta={"Đang xử lý: " + laySoLieuQuanTri(duLieu.processingOrders)}
        />
        <OChiSoQuanTri
          icon={Truck}
          tone="var(--blue)"
          value={laySoLieuQuanTri(duLieu.shippingOrders)}
          label="Đang giao"
          meta={"Đã giao: " + laySoLieuQuanTri(duLieu.deliveredOrders)}
        />
        <OChiSoQuanTri
          icon={Check}
          tone="var(--green-dark)"
          value={laySoLieuQuanTri(duLieu.completedOrders)}
          label="Hoàn tất"
          meta={
            "Tỷ lệ: " +
            dinhDangPhanTramQuanTri(duLieu.completionRate) +
            " · TB " +
            dinhDangTien(duLieu.averageOrderValueMinor)
          }
        />
        <OChiSoQuanTri
          icon={XCircle}
          tone="var(--red)"
          value={laySoLieuQuanTri(duLieu.cancelledOrders)}
          label="Đã huỷ"
          meta={"Tỷ lệ: " + dinhDangPhanTramQuanTri(duLieu.cancellationRate)}
        />
        <OChiSoQuanTri
          icon={Users}
          tone="var(--ink-2)"
          value={laySoLieuQuanTri(duLieu.totalUsers)}
          label="Người dùng"
          meta={laySoLieuQuanTri(duLieu.activeUsers) + " đang hoạt động"}
        />
        <OChiSoQuanTri
          icon={Package}
          tone="var(--green-dark)"
          value={laySoLieuQuanTri(duLieu.totalProducts)}
          label="Sản phẩm"
          meta="Đang quản lý trong catalog"
        />
      </div>

      <div className="panel-grid">
        <section className="panel-card">
          <div className="panel-card__head">
            <h2>Đơn hàng gần đây</h2>
            <Link to="/admin/orders">
              Xem tất cả <ArrowRight size={13} />
            </Link>
          </div>
          {phanTuChuaCoDon}
          {phanTuBangDonHang}
        </section>

        <section className="panel-card">
          <div className="panel-card__head">
            <h2>Đơn theo trạng thái</h2>
            <span className="cell-sub">{tongSoDon} đơn</span>
          </div>
          <div className="panel-card__body">
            <div className="bars">{cacDongThongKe}</div>
          </div>
        </section>
      </div>

      <p className="admin-footnote">
        Doanh thu chỉ tính các đơn ở trạng thái Hoàn tất. Quản lý sản phẩm
        và đơn hàng tại menu bên trái.
      </p>
    </div>
  );
}
