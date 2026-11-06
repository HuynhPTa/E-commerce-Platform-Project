import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  Inbox,
  LoaderCircle,
  Search,
  Truck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import OChiSoQuanTri from "../../components/admin/AdminStatCard";
import ChiTietDonHangQuanTri from "../../components/admin/OrderDetailModal";
import HuyHieuTrangThaiDonHang from "../../components/admin/OrderStatusBadge";
import {
  CAC_HANH_DONG_DON_HANG,
  CAC_TAB_TRANG_THAI_DON_HANG,
} from "../../components/admin/adminOrderStatus";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useCapNhatTrangThaiDonHangQuanTri,
  useChiTietDonHangQuanTri,
  useDanhSachDonHangQuanTri,
  useThongKeDonHangQuanTri,
} from "../../hooks/useAdmin";
import {
  dinhDangNgayDayDu,
  dinhDangPhanTramQuanTri,
  laySoLieuQuanTri,
  layThongBaoLoi,
} from "../../lib/adminHelpers";
import { dinhDangTien } from "../../lib/formatMoney";
import { layNhanPhuongThucThanhToan } from "../../lib/orderFormat";

// Thành phần này hiển thị trang quản lý đơn hàng.
export default function TrangDonHangQuanTri() {
  const trangThaiTab = useState("ALL");
  const tabDangChon = trangThaiTab[0];
  const capNhatTab = trangThaiTab[1];

  const trangThaiTuKhoa = useState("");
  const tuKhoa = trangThaiTuKhoa[0];
  const capNhatTuKhoa = trangThaiTuKhoa[1];

  const trangThaiSoTrang = useState(1);
  const soTrang = trangThaiSoTrang[0];
  const capNhatSoTrang = trangThaiSoTrang[1];

  const trangThaiMaDon = useState(null);
  const maDonDangXem = trangThaiMaDon[0];
  const capNhatMaDon = trangThaiMaDon[1];

  const trangThaiChoXacNhan = useState(null);
  const trangThaiCanXacNhan = trangThaiChoXacNhan[0];
  const capNhatTrangThaiCanXacNhan = trangThaiChoXacNhan[1];

  const tuKhoaTre = useDebounce(tuKhoa.trim(), 400);

  // Bộ lọc này được gửi lên backend mỗi khi tab, từ khoá hoặc trang đổi.
  const thamSoTruyVan = {
    page: soTrang,
    size: 10,
  };

  if (tabDangChon !== "ALL") {
    thamSoTruyVan.status = tabDangChon;
  }

  if (tuKhoaTre !== "") {
    thamSoTruyVan.q = tuKhoaTre;
  }

  const ketQuaThongKe = useThongKeDonHangQuanTri();
  const ketQuaDonHang = useDanhSachDonHangQuanTri(thamSoTruyVan);
  const ketQuaChiTiet = useChiTietDonHangQuanTri(maDonDangXem);
  const capNhatTrangThai = useCapNhatTrangThaiDonHangQuanTri();

  // Biến này lưu số liệu thống kê sau khi kiểm tra dữ liệu.
  let duLieuThongKe = {};

  if (ketQuaThongKe.data !== null) {
    if (ketQuaThongKe.data !== undefined) {
      duLieuThongKe = ketQuaThongKe.data;
    }
  }

  // Biến này lưu danh sách đơn hàng sau khi kiểm tra dữ liệu.
  let danhSachDonHang = [];

  if (ketQuaDonHang.data !== null) {
    if (ketQuaDonHang.data !== undefined) {
      if (Array.isArray(ketQuaDonHang.data.items) === true) {
        danhSachDonHang = ketQuaDonHang.data.items;
      }
    }
  }

  // Các biến này lưu thông tin phân trang do backend trả về.
  let trangHienTai = 1;
  let tongSoTrang = 1;
  let tongSoDon = 0;

  if (ketQuaDonHang.data !== null) {
    if (ketQuaDonHang.data !== undefined) {
      const soTrangTuBackend = Number(ketQuaDonHang.data.totalPages);
      const soDonTuBackend = Number(ketQuaDonHang.data.totalItems);
      const trangTuBackend = Number(ketQuaDonHang.data.page);

      if (Number.isFinite(trangTuBackend) === true) {
        if (trangTuBackend > 0) {
          trangHienTai = trangTuBackend;
        }
      }

      if (Number.isFinite(soTrangTuBackend) === true) {
        if (soTrangTuBackend > 0) {
          tongSoTrang = soTrangTuBackend;
        }
      }

      if (Number.isFinite(soDonTuBackend) === true) {
        tongSoDon = soDonTuBackend;
      }
    }
  }

  // Hàm này đổi tab trạng thái và quay về trang đầu.
  function xuLyChonTab(suKienBam) {
    capNhatTab(suKienBam.currentTarget.value);
    capNhatSoTrang(1);
  }

  // Hàm này cập nhật từ khoá tìm kiếm và quay về trang đầu.
  function xuLyThayDoiTuKhoa(suKienNhap) {
    capNhatTuKhoa(suKienNhap.target.value);
    capNhatSoTrang(1);
  }

  // Hàm này đưa danh sách về trang trước.
  function xuLyVeTrangTruoc() {
    if (soTrang > 1) {
      capNhatSoTrang(soTrang - 1);
    }
  }

  // Hàm này đưa danh sách sang trang sau.
  function xuLySangTrangSau() {
    if (soTrang < tongSoTrang) {
      capNhatSoTrang(soTrang + 1);
    }
  }

  // Hàm này đóng hộp thoại chi tiết và xoá trạng thái xác nhận.
  function xuLyDongChiTiet() {
    capNhatMaDon(null);
    capNhatTrangThaiCanXacNhan(null);
    capNhatTrangThai.reset();
  }

  // Hàm này cập nhật trạng thái của đơn hàng đang mở.
  function xuLyCapNhatTrangThai(maDon, trangThaiMoi) {
    capNhatTrangThai.mutate(
      { orderId: maDon, status: trangThaiMoi },
      {
        onSuccess: function () {
          capNhatTrangThaiCanXacNhan(null);
        },
      },
    );
  }

  // Mảng này lưu giao diện các tab trạng thái.
  const cacTabTrangThai = [];

  for (const tabTrangThai of CAC_TAB_TRANG_THAI_DON_HANG) {
    // Biến này lưu số đơn của trạng thái tương ứng.
    let soDonCuaTab = 0;

    if (tabTrangThai.key === "ALL") {
      const tongDonTuBackend = Number(duLieuThongKe.totalOrders);

      if (Number.isFinite(tongDonTuBackend) === true) {
        soDonCuaTab = tongDonTuBackend;
      }
    } else {
      if (duLieuThongKe.ordersByStatus !== null) {
        if (duLieuThongKe.ordersByStatus !== undefined) {
          const soDonTheoTrangThai =
            duLieuThongKe.ordersByStatus[tabTrangThai.key];

          if (soDonTheoTrangThai !== null) {
            if (soDonTheoTrangThai !== undefined) {
              soDonCuaTab = soDonTheoTrangThai;
            }
          }
        }
      }
    }

    // Biến này cho biết tab hiện tại có đang được chọn hay không.
    let dangDuocChon = false;

    if (tabDangChon === tabTrangThai.key) {
      dangDuocChon = true;
    }

    // Biến này lưu giá trị aria-current của tab.
    let giaTriAriaCurrent = "false";

    if (dangDuocChon === true) {
      giaTriAriaCurrent = "page";
    }

    cacTabTrangThai.push(
      <button
        className="filter-tab"
        type="button"
        key={tabTrangThai.key}
        value={tabTrangThai.key}
        aria-current={giaTriAriaCurrent}
        onClick={xuLyChonTab}
      >
        {tabTrangThai.label}
        <span className="filter-tab__count">{soDonCuaTab}</span>
      </button>,
    );
  }

  // Mảng này lưu giao diện từng dòng đơn hàng.
  const cacDongDonHang = [];

  for (const donHang of danhSachDonHang) {
    // Hàm này mở chi tiết đơn hàng hiện tại.
    const xuLyXem = function () {
      capNhatTrangThaiCanXacNhan(null);
      capNhatTrangThai.reset();
      capNhatMaDon(donHang.id);
    };

    cacDongDonHang.push(
      <tr key={donHang.id}>
        <td>
          <strong>#{donHang.id}</strong>
        </td>
        <td>
          {donHang.buyerName}
          <div className="cell-sub">{donHang.buyerEmail}</div>
        </td>
        <td>{donHang.itemCount}</td>
        <td className="num">{dinhDangTien(donHang.totalMinor)}</td>
        <td>{layNhanPhuongThucThanhToan(donHang.paymentMethod)}</td>
        <td>
          <HuyHieuTrangThaiDonHang status={donHang.status} />
        </td>
        <td>{dinhDangNgayDayDu(donHang.createdAt)}</td>
        <td>
          <div className="table-actions">
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              title="Xem và xử lý đơn"
              onClick={xuLyXem}
            >
              <Eye size={15} /> Chi tiết
            </button>
          </div>
        </td>
      </tr>,
    );
  }

  // Biến này lưu đơn hàng đang mở chi tiết.
  const donHangDangXem = ketQuaChiTiet.data;

  // Mảng này lưu các hành động hợp lệ với trạng thái hiện tại.
  const cacHanhDong = [];

  if (donHangDangXem !== null) {
    if (donHangDangXem !== undefined) {
      const danhSachHanhDong = CAC_HANH_DONG_DON_HANG[donHangDangXem.status];

      if (Array.isArray(danhSachHanhDong) === true) {
        for (const hanhDong of danhSachHanhDong) {
          cacHanhDong.push(hanhDong);
        }
      }
    }
  }

  // Mảng này lưu các nút hành động trong chân hộp thoại.
  const cacNutHanhDong = [];

  for (const hanhDong of cacHanhDong) {
    const trangThaiHanhDong = hanhDong.status;

    // Hàm này chạy hành động của đơn hàng đang mở.
    const xuLyHanhDong = function () {
      if (hanhDong.confirm === true) {
        capNhatTrangThaiCanXacNhan(trangThaiHanhDong);
        return;
      }

      xuLyCapNhatTrangThai(donHangDangXem.id, trangThaiHanhDong);
    };

    cacNutHanhDong.push(
      <button
        className={hanhDong.className}
        type="button"
        key={trangThaiHanhDong}
        disabled={capNhatTrangThai.isPending === true}
        onClick={xuLyHanhDong}
      >
        {hanhDong.label}
      </button>,
    );
  }

  // Phần tử này hiển thị biểu tượng chờ trên nút huỷ đơn.
  let phanTuBieuTuongHuy = null;

  if (capNhatTrangThai.isPending === true) {
    phanTuBieuTuongHuy = <LoaderCircle className="spin" size={16} />;
  }

  // Phần tử này hiển thị chân hộp thoại chi tiết đơn hàng.
  let chanHopThoai = (
    <button className="btn" type="button" onClick={xuLyDongChiTiet}>
      Đóng
    </button>
  );

  if (donHangDangXem !== null) {
    if (donHangDangXem !== undefined) {
      if (trangThaiCanXacNhan !== null) {
        chanHopThoai = (
          <>
            <span className="admin-modal-note">
              Huỷ đơn #{donHangDangXem.id}? Hàng sẽ được hoàn lại kho.
            </span>
            <button
              className="btn"
              type="button"
              disabled={capNhatTrangThai.isPending === true}
              onClick={function () {
                capNhatTrangThaiCanXacNhan(null);
              }}
            >
              Không
            </button>
            <button
              className="btn btn--danger"
              type="button"
              disabled={capNhatTrangThai.isPending === true}
              onClick={function () {
                xuLyCapNhatTrangThai(
                  donHangDangXem.id,
                  trangThaiCanXacNhan,
                );
              }}
            >
              {phanTuBieuTuongHuy}
              Xác nhận huỷ
            </button>
          </>
        );
      } else {
        chanHopThoai = (
          <>
            <button className="btn" type="button" onClick={xuLyDongChiTiet}>
              Đóng
            </button>
            {cacNutHanhDong}
          </>
        );
      }
    }
  }

  // Phần tử này hiển thị lỗi khi cập nhật trạng thái thất bại.
  let phanTuThongBaoLoi = null;

  if (capNhatTrangThai.isError === true) {
    phanTuThongBaoLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(capNhatTrangThai.error)}</div>
      </div>
    );
  }

  // Phần tử này hiển thị trạng thái đang tải đơn hàng.
  let phanTuDangTai = null;

  if (ketQuaDonHang.isLoading === true) {
    phanTuDangTai = (
      <div className="admin-state">
        <LoaderCircle className="spin" size={24} />
        <span>Đang tải đơn hàng…</span>
      </div>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được đơn hàng.
  let phanTuLoi = null;

  if (ketQuaDonHang.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>Không tải được danh sách đơn hàng.</div>
      </div>
    );
  }

  // Phần tử này hiển thị trạng thái không có đơn phù hợp.
  let phanTuRong = null;

  if (ketQuaDonHang.isLoading === false) {
    if (ketQuaDonHang.isError === false) {
      if (cacDongDonHang.length === 0) {
        phanTuRong = (
          <div className="admin-state">
            <Inbox size={34} />
            <span>Không có đơn hàng phù hợp.</span>
          </div>
        );
      }
    }
  }

  // Phần tử này hiển thị biểu tượng khi danh sách đang làm mới.
  let phanTuDangCapNhat = null;

  if (ketQuaDonHang.isFetching === true) {
    phanTuDangCapNhat = <LoaderCircle className="spin muted" size={16} />;
  }

  // Phần tử này hiển thị nút chuyển trang trước.
  let phanTuTrangTruoc = (
    <button className="btn btn--ghost btn--sm" type="button" disabled>
      <ChevronLeft size={16} /> Trước
    </button>
  );

  if (trangHienTai > 1) {
    phanTuTrangTruoc = (
      <button
        className="btn btn--ghost btn--sm"
        type="button"
        onClick={xuLyVeTrangTruoc}
      >
        <ChevronLeft size={16} /> Trước
      </button>
    );
  }

  // Phần tử này hiển thị nút chuyển trang sau.
  let phanTuTrangSau = (
    <button className="btn btn--ghost btn--sm" type="button" disabled>
      Sau <ChevronRight size={16} />
    </button>
  );

  if (trangHienTai < tongSoTrang) {
    phanTuTrangSau = (
      <button
        className="btn btn--ghost btn--sm"
        type="button"
        onClick={xuLySangTrangSau}
      >
        Sau <ChevronRight size={16} />
      </button>
    );
  }

  // Phần tử này hiển thị bảng và thanh phân trang khi có đơn hàng.
  let phanTuBangDonHang = null;

  if (cacDongDonHang.length > 0) {
    phanTuBangDonHang = (
      <>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Người mua</th>
                <th>Số món</th>
                <th className="num">Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
                <th className="num">Chi tiết</th>
              </tr>
            </thead>
            <tbody>{cacDongDonHang}</tbody>
          </table>
        </div>

        <div className="pagination admin-pagination">
          {phanTuTrangTruoc}
          <span className="muted">
            Trang {trangHienTai} / {tongSoTrang} · {tongSoDon} đơn
          </span>
          {phanTuTrangSau}
        </div>
      </>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được số liệu thống kê.
  let phanTuLoiThongKe = null;

  if (ketQuaThongKe.isError === true) {
    phanTuLoiThongKe = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>Không tải được số liệu thống kê đơn hàng.</div>
      </div>
    );
  }

  // Phần tử này hiển thị hộp thoại chi tiết đơn hàng.
  let phanTuChiTiet = null;

  if (maDonDangXem !== null) {
    phanTuChiTiet = (
      <ChiTietDonHangQuanTri
        order={donHangDangXem}
        isLoading={ketQuaChiTiet.isLoading}
        isError={ketQuaChiTiet.isError}
        error={ketQuaChiTiet.error}
        onClose={xuLyDongChiTiet}
        footer={chanHopThoai}
        notice={phanTuThongBaoLoi}
      />
    );
  }

  return (
    <div>
      <div className="panel__head">
        <div>
          <p className="eyebrow-free">Vận hành</p>
          <h1>Quản lý đơn hàng</h1>
        </div>
      </div>

      <div className="stat-grid stat-grid--dashboard">
        <OChiSoQuanTri
          icon={Wallet}
          tone="var(--green)"
          value={dinhDangTien(duLieuThongKe.revenueMinor)}
          label="Doanh thu hoàn tất"
          meta={
            "Hôm nay: " +
            dinhDangTien(duLieuThongKe.todayRevenueMinor) +
            " · TB " +
            dinhDangTien(duLieuThongKe.averageOrderValueMinor)
          }
        />
        <OChiSoQuanTri
          icon={ClipboardList}
          tone="var(--blue)"
          value={laySoLieuQuanTri(duLieuThongKe.totalOrders)}
          label="Tổng đơn hàng"
          meta={"Hôm nay: " + laySoLieuQuanTri(duLieuThongKe.todayOrders) + " đơn"}
        />
        <OChiSoQuanTri
          icon={Clock}
          tone="var(--amber)"
          value={laySoLieuQuanTri(duLieuThongKe.pendingOrders)}
          label="Chờ xác nhận"
          meta={"Đang xử lý: " + laySoLieuQuanTri(duLieuThongKe.processingOrders)}
        />
        <OChiSoQuanTri
          icon={Truck}
          tone="var(--blue)"
          value={laySoLieuQuanTri(duLieuThongKe.shippingOrders)}
          label="Đang giao"
          meta={"Đã giao: " + laySoLieuQuanTri(duLieuThongKe.deliveredOrders)}
        />
        <OChiSoQuanTri
          icon={Check}
          tone="var(--green-dark)"
          value={laySoLieuQuanTri(duLieuThongKe.completedOrders)}
          label="Hoàn tất"
          meta={
            "Tỷ lệ: " +
            dinhDangPhanTramQuanTri(duLieuThongKe.completionRate) +
            " · Huỷ: " +
            laySoLieuQuanTri(duLieuThongKe.cancelledOrders)
          }
        />
      </div>

      {phanTuLoiThongKe}

      <section className="panel-card">
        <div className="filter-tabs panel-card__tabs">{cacTabTrangThai}</div>

        <div className="panel-toolbar admin-toolbar-pad">
          <label className="search-inline">
            <Search size={15} className="muted" />
            <input
              type="search"
              value={tuKhoa}
              onChange={xuLyThayDoiTuKhoa}
              placeholder="Tìm theo mã đơn, email hoặc tên người mua…"
              aria-label="Tìm đơn hàng"
            />
          </label>
          {phanTuDangCapNhat}
        </div>

        {phanTuDangTai}
        {phanTuLoi}
        {phanTuRong}
        {phanTuBangDonHang}
      </section>

      {phanTuChiTiet}
    </div>
  );
}
