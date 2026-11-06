import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import HopThoaiQuanTri from "../../components/admin/AdminModal";
import OChiSoQuanTri from "../../components/admin/AdminStatCard";
import AnhSanPhamNho from "../../components/admin/ProductThumb";
import {
  useDanhSachSanPhamQuanTri,
  useThongKeSanPhamQuanTri,
  useXoaSanPhamQuanTri,
} from "../../hooks/useAdminProducts";
import {
  demPhanTuMang,
  dinhDangNgayDayDu,
  layKhoangGiaSanPham,
  laySoLieuQuanTri,
  layThongBaoLoi,
  tinhTongTonKho,
} from "../../lib/adminHelpers";

// Mảng này khai báo hai tab trạng thái của danh sách sản phẩm.
const CAC_TAB_SAN_PHAM = [
  { key: "ACTIVE", label: "Đang bán" },
  { key: "DELETED", label: "Đã xoá" },
];

// Thành phần này hiển thị hộp thoại xác nhận xoá mềm sản phẩm.
function HopThoaiXoaSanPham(thuocTinh) {
  const xoaSanPham = useXoaSanPhamQuanTri();
  const sanPham = thuocTinh.product;

  // Hàm này xoá mềm sản phẩm hiện tại.
  function xuLyXoaSanPham() {
    xoaSanPham.mutate(sanPham.id, {
      onSuccess: function () {
        thuocTinh.onDeleted();
        thuocTinh.onClose();
      },
    });
  }

  // Phần tử này hiển thị lỗi nếu không xoá được sản phẩm.
  let phanTuLoi = null;

  if (xoaSanPham.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(xoaSanPham.error)}</div>
      </div>
    );
  }

  // Phần tử này hiển thị biểu tượng trên nút xoá.
  let phanTuBieuTuongXoa = <Trash2 size={16} />;

  if (xoaSanPham.isPending === true) {
    phanTuBieuTuongXoa = <LoaderCircle className="spin" size={16} />;
  }

  return (
    <HopThoaiQuanTri
      title="Xoá sản phẩm"
      onClose={thuocTinh.onClose}
      width={500}
      footer={
        <>
          <button className="btn" type="button" onClick={thuocTinh.onClose}>
            Huỷ
          </button>
          <button
            className="btn btn--danger"
            type="button"
            disabled={xoaSanPham.isPending === true}
            onClick={xuLyXoaSanPham}
          >
            {phanTuBieuTuongXoa}
            Xoá sản phẩm
          </button>
        </>
      }
    >
      <div className="cell-main admin-delete-target">
        <AnhSanPhamNho sanPham={sanPham} />
        <div>
          <strong>{sanPham.name}</strong>
          <div className="cell-sub">#{sanPham.id}</div>
        </div>
      </div>
      <p>
        Sản phẩm sẽ bị ẩn khỏi website (xoá mềm) và không thể thêm vào giỏ.
      </p>
      <p className="muted">
        Bạn vẫn xem lại được trong tab “Đã xoá”, nhưng không thể chỉnh sửa.
      </p>
      {phanTuLoi}
    </HopThoaiQuanTri>
  );
}

// Thành phần này hiển thị trang quản lý sản phẩm.
export default function TrangSanPhamQuanTri() {
  const trangThaiTab = useState("ACTIVE");
  const tabDangChon = trangThaiTab[0];
  const capNhatTab = trangThaiTab[1];

  const trangThaiTuKhoa = useState("");
  const tuKhoa = trangThaiTuKhoa[0];
  const capNhatTuKhoa = trangThaiTuKhoa[1];

  const trangThaiSoTrang = useState(1);
  const soTrang = trangThaiSoTrang[0];
  const capNhatSoTrang = trangThaiSoTrang[1];

  const trangThaiDangXoa = useState(null);
  const dangXoa = trangThaiDangXoa[0];
  const capNhatDangXoa = trangThaiDangXoa[1];

  // Biến này lưu bộ lọc gửi lên backend.
  const thamSoTruyVan = {
    status: tabDangChon,
    page: soTrang,
    size: 10,
  };

  if (tuKhoa.trim() !== "") {
    thamSoTruyVan.q = tuKhoa.trim();
  }

  const ketQuaSanPham = useDanhSachSanPhamQuanTri(thamSoTruyVan);
  const ketQuaThongKe = useThongKeSanPhamQuanTri();

  // Biến này lưu số liệu thống kê sau khi kiểm tra dữ liệu.
  let duLieuThongKe = {};

  if (ketQuaThongKe.data !== null) {
    if (ketQuaThongKe.data !== undefined) {
      duLieuThongKe = ketQuaThongKe.data;
    }
  }

  // Biến này lưu danh sách sản phẩm sau khi kiểm tra dữ liệu.
  let danhSachSanPham = [];

  if (ketQuaSanPham.data !== null) {
    if (ketQuaSanPham.data !== undefined) {
      if (Array.isArray(ketQuaSanPham.data.items) === true) {
        danhSachSanPham = ketQuaSanPham.data.items;
      }
    }
  }

  // Các biến này lưu thông tin phân trang do backend trả về.
  let trangHienTai = 1;
  let tongSoTrang = 1;
  let tongSoSanPham = 0;

  if (ketQuaSanPham.data !== null) {
    if (ketQuaSanPham.data !== undefined) {
      const soTrangTuBackend = Number(ketQuaSanPham.data.totalPages);
      const soSanPhamTuBackend = Number(ketQuaSanPham.data.totalItems);
      const trangTuBackend = Number(ketQuaSanPham.data.page);

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

      if (Number.isFinite(soSanPhamTuBackend) === true) {
        tongSoSanPham = soSanPhamTuBackend;
      }
    }
  }

  // Hàm này chuyển sang tab trạng thái mới.
  function xuLyChonTab(suKienBam) {
    capNhatTab(suKienBam.currentTarget.value);
    capNhatSoTrang(1);
  }

  // Hàm này cập nhật từ khoá tìm kiếm.
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

  // Hàm này xử lý sau khi một sản phẩm bị xoá mềm.
  function xuLySauKhiXoa() {
    if (danhSachSanPham.length === 1) {
      if (soTrang > 1) {
        capNhatSoTrang(soTrang - 1);
      }
    }
  }

  // Mảng này lưu các tab trạng thái.
  const cacTabSanPham = [];

  for (const tabSanPham of CAC_TAB_SAN_PHAM) {
    // Biến này cho biết tab hiện tại có đang được chọn hay không.
    let dangDuocChon = false;

    if (tabDangChon === tabSanPham.key) {
      dangDuocChon = true;
    }

    // Biến này lưu giá trị aria-current của tab.
    let giaTriAriaCurrent = "false";

    if (dangDuocChon === true) {
      giaTriAriaCurrent = "page";
    }

    cacTabSanPham.push(
      <button
        className="filter-tab"
        type="button"
        key={tabSanPham.key}
        value={tabSanPham.key}
        aria-current={giaTriAriaCurrent}
        onClick={xuLyChonTab}
      >
        {tabSanPham.label}
      </button>,
    );
  }

  // Mảng này lưu giao diện từng dòng sản phẩm.
  const cacDongSanPham = [];

  for (const sanPham of danhSachSanPham) {
    // Hàm này mở hộp thoại xoá sản phẩm hiện tại.
    const xuLyXoa = function () {
      capNhatDangXoa(sanPham);
    };

    // Biến này lưu trạng thái hiển thị của sản phẩm.
    let nhanTrangThai = "Đang bán";
    let lopTrangThai = "status status--completed";

    if (sanPham.status === "DELETED") {
      nhanTrangThai = "Đã xoá";
      lopTrangThai = "status status--muted";
    }

    // Biến này lưu tên danh mục hiển thị.
    let tenDanhMuc = "—";

    if (typeof sanPham.categoryName === "string") {
      if (sanPham.categoryName !== "") {
        tenDanhMuc = sanPham.categoryName;
      }
    }

    const soBienThe = demPhanTuMang(sanPham.variants);
    const soAnh = demPhanTuMang(sanPham.images);
    const khoangGia = layKhoangGiaSanPham(sanPham);
    const tongTonKho = tinhTongTonKho(sanPham);

    // Phần tử này hiển thị nút xoá khi sản phẩm còn đang bán.
    let phanTuNutXoa = null;

    if (sanPham.status === "ACTIVE") {
      phanTuNutXoa = (
        <button
          className="btn btn--danger btn--sm"
          type="button"
          title="Xoá sản phẩm"
          onClick={xuLyXoa}
        >
          <Trash2 size={15} />
        </button>
      );
    }

    cacDongSanPham.push(
      <tr key={sanPham.id}>
        <td>
          <div className="table-product">
            <AnhSanPhamNho sanPham={sanPham} />
            <div>
              <span className="table-product__name">{sanPham.name}</span>
              <span className="table-product__sku">
                #{sanPham.id} · {soBienThe} biến thể · {soAnh} ảnh
              </span>
            </div>
          </div>
        </td>
        <td>{tenDanhMuc}</td>
        <td>{khoangGia}</td>
        <td>{tongTonKho}</td>
        <td>
          <span className={lopTrangThai}>{nhanTrangThai}</span>
        </td>
        <td>{dinhDangNgayDayDu(sanPham.createdAt)}</td>
        <td>
          <div className="table-actions">
            <Link
              className="btn btn--ghost btn--sm"
              to={"/admin/products/" + sanPham.id}
              title="Sửa sản phẩm"
            >
              <Pencil size={15} />
            </Link>
            {phanTuNutXoa}
          </div>
        </td>
      </tr>,
    );
  }

  // Phần tử này hiển thị trạng thái đang tải sản phẩm.
  let phanTuDangTai = null;

  if (ketQuaSanPham.isLoading === true) {
    phanTuDangTai = (
      <div className="admin-state">
        <LoaderCircle className="spin" size={24} />
        <span>Đang tải sản phẩm…</span>
      </div>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được sản phẩm.
  let phanTuLoi = null;

  if (ketQuaSanPham.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>Không tải được danh sách sản phẩm.</div>
      </div>
    );
  }

  // Phần tử này hiển thị trạng thái danh sách rỗng.
  let phanTuRong = null;

  if (ketQuaSanPham.isLoading === false) {
    if (ketQuaSanPham.isError === false) {
      if (cacDongSanPham.length === 0) {
        // Biến này lưu thông điệp khi danh sách rỗng.
        let thongDiepRong = "Chưa có sản phẩm nào trong mục này.";

        if (tuKhoa.trim() !== "") {
          thongDiepRong = "Không tìm thấy sản phẩm phù hợp.";
        }

        // Phần tử này hiển thị nút tạo sản phẩm đầu tiên.
        let phanTuTaoMoi = null;

        if (tabDangChon === "ACTIVE") {
          if (tuKhoa.trim() === "") {
            phanTuTaoMoi = (
              <Link className="btn btn--primary" to="/admin/products/new">
                <PackagePlus size={16} /> Tạo sản phẩm đầu tiên
              </Link>
            );
          }
        }

        phanTuRong = (
          <div className="admin-state">
            <Inbox size={34} />
            <span>{thongDiepRong}</span>
            {phanTuTaoMoi}
          </div>
        );
      }
    }
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

  // Phần tử này hiển thị biểu tượng khi danh sách đang làm mới.
  let phanTuDangCapNhat = null;

  if (ketQuaSanPham.isFetching === true) {
    phanTuDangCapNhat = <LoaderCircle className="spin muted" size={16} />;
  }

  // Phần tử này hiển thị bảng và thanh phân trang khi có sản phẩm.
  let phanTuBangSanPham = null;

  if (cacDongSanPham.length > 0) {
    phanTuBangSanPham = (
      <>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="num">Thao tác</th>
              </tr>
            </thead>
            <tbody>{cacDongSanPham}</tbody>
          </table>
        </div>

        <div className="pagination admin-pagination">
          {phanTuTrangTruoc}
          <span className="muted">
            Trang {trangHienTai} / {tongSoTrang} · {tongSoSanPham} sản phẩm
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
        <div>Không tải được số liệu thống kê sản phẩm.</div>
      </div>
    );
  }

  // Phần tử này hiển thị hộp thoại xoá sản phẩm.
  let phanTuHopThoaiXoa = null;

  if (dangXoa !== null) {
    phanTuHopThoaiXoa = (
      <HopThoaiXoaSanPham
        product={dangXoa}
        onDeleted={xuLySauKhiXoa}
        onClose={function () {
          capNhatDangXoa(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="panel__head">
        <div>
          <p className="eyebrow-free">Catalog</p>
          <h1>Quản lý sản phẩm</h1>
        </div>
        <div className="panel__head-actions">
          <Link className="btn btn--primary btn--sm" to="/admin/products/new">
            <Plus size={15} /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      <div className="stat-grid stat-grid--dashboard">
        <OChiSoQuanTri
          icon={Package}
          tone="var(--green)"
          value={laySoLieuQuanTri(duLieuThongKe.activeProducts)}
          label="Đang bán"
          meta={
            "Đã xoá: " + laySoLieuQuanTri(duLieuThongKe.deletedProducts) + " sản phẩm"
          }
        />
        <OChiSoQuanTri
          icon={Boxes}
          tone="var(--blue)"
          value={laySoLieuQuanTri(duLieuThongKe.totalVariants)}
          label="Biến thể"
          meta={"Đã bán: " + laySoLieuQuanTri(duLieuThongKe.soldCount) + " sản phẩm"}
        />
        <OChiSoQuanTri
          icon={Archive}
          tone="var(--ink-2)"
          value={laySoLieuQuanTri(duLieuThongKe.totalStock)}
          label="Tồn kho"
          meta={"Danh mục đang dùng: " + laySoLieuQuanTri(duLieuThongKe.categoriesInUse)}
        />
        <OChiSoQuanTri
          icon={TriangleAlert}
          tone="var(--amber)"
          value={laySoLieuQuanTri(duLieuThongKe.lowStockVariants)}
          label="Sắp hết hàng"
          meta="Biến thể còn từ 1 đến 5 sản phẩm"
        />
        <OChiSoQuanTri
          icon={Trash2}
          tone="var(--red)"
          value={laySoLieuQuanTri(duLieuThongKe.outOfStockVariants)}
          label="Hết hàng"
          meta="Biến thể cần nhập thêm"
        />
      </div>

      {phanTuLoiThongKe}

      <section className="panel-card">
        <div className="filter-tabs panel-card__tabs">{cacTabSanPham}</div>

        <div className="panel-toolbar admin-toolbar-pad">
          <label className="search-inline">
            <Search size={15} className="muted" />
            <input
              type="search"
              value={tuKhoa}
              onChange={xuLyThayDoiTuKhoa}
              placeholder="Tìm theo tên sản phẩm…"
              aria-label="Tìm sản phẩm"
            />
          </label>
          {phanTuDangCapNhat}
        </div>

        {phanTuDangTai}
        {phanTuLoi}
        {phanTuRong}
        {phanTuBangSanPham}
      </section>

      {phanTuHopThoaiXoa}
    </div>
  );
}
