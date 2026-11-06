import { useState } from "react";
/* eslint-disable react-hooks/refs -- react-hook-form trả về ref cho input không kiểm soát; quy tắc hiểu nhầm cả đối tượng register là ref. */
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  ExternalLink,
  Folder,
  FolderTree,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import HopThoaiQuanTri from "../../components/admin/AdminModal";
import OChiSoQuanTri from "../../components/admin/AdminStatCard";
import BieuTuongDanhMuc from "../../components/admin/CategoryIcon";
import { TEN_CAC_BIEU_TUONG } from "../../components/admin/categoryIcons";
import {
  useCapNhatDanhMucQuanTri,
  useDanhSachDanhMucPhang,
  useTaoDanhMucQuanTri,
  useThongKeDanhMucQuanTri,
  useXoaDanhMucQuanTri,
} from "../../hooks/useAdminCategories";
import {
  laySoLieuQuanTri,
  layThongBaoLoi,
  taoSlugTuTen,
  timIdDanhMucCon,
} from "../../lib/adminHelpers";
import { danhMucSchema } from "../../lib/adminSchemas";

// Hàm này trả về lớp CSS của một trường dựa trên trạng thái lỗi.
function layLopTruong(coLoi) {
  if (coLoi === true) {
    return "field has-error";
  }

  return "field";
}

// Thành phần này hiển thị lỗi của một trường nếu có.
function LoiTruong(thuocTinh) {
  const loi = thuocTinh.error;

  if (loi === undefined) {
    return null;
  }

  return (
    <p className="field-error" role="alert">
      {loi.message}
    </p>
  );
}

// Hàm này tạo khoảng thụt đầu dòng theo độ sâu của danh mục.
function taoKhoangThutDoSau(doSau) {
  let khoangThut = "";

  let chiSo = 0;

  while (chiSo < doSau) {
    khoangThut = khoangThut + "\u00a0\u00a0\u00a0";
    chiSo = chiSo + 1;
  }

  return khoangThut;
}

// Thành phần này hiển thị hộp thoại thêm hoặc sửa danh mục.
function HopThoaiDanhMuc(thuocTinh) {
  const danhSachPhang = thuocTinh.flat;
  const cheDoSua = thuocTinh.editing.mode === "edit";

  // Biến này lưu danh mục đang sửa, mặc định là null khi thêm mới.
  let danhMucDangSua = null;

  if (cheDoSua === true) {
    danhMucDangSua = thuocTinh.editing.category;
  }

  // Biến này lưu id danh mục cha mặc định khi thêm danh mục con.
  let maDanhMucChaMacDinh = "";

  if (thuocTinh.editing.parentId !== null) {
    if (thuocTinh.editing.parentId !== undefined) {
      maDanhMucChaMacDinh = String(thuocTinh.editing.parentId);
    }
  }

  // Biến này lưu giá trị ban đầu của biểu mẫu.
  let giaTriBanDau = {
    name: "",
    slug: "",
    parentId: maDanhMucChaMacDinh,
    icon: "",
    sortOrder: 0,
  };

  if (danhMucDangSua !== null) {
    giaTriBanDau.name = danhMucDangSua.name;
    giaTriBanDau.slug = danhMucDangSua.slug;
    giaTriBanDau.sortOrder = danhMucDangSua.sortOrder;

    // Backend có thể trả icon là null, nên đổi về chuỗi rỗng cho biểu mẫu hợp lệ.
    let iconBanDau = "";

    if (typeof danhMucDangSua.icon === "string") {
      iconBanDau = danhMucDangSua.icon;
    }

    giaTriBanDau.icon = iconBanDau;

    if (danhMucDangSua.parentId !== null) {
      if (danhMucDangSua.parentId !== undefined) {
        giaTriBanDau.parentId = String(danhMucDangSua.parentId);
      }
    }
  }

  const bieuMau = useForm({
    resolver: zodResolver(danhMucSchema),
    defaultValues: giaTriBanDau,
  });

  const tenDangNhap = useWatch({ control: bieuMau.control, name: "name" });
  const slugDangNhap = useWatch({ control: bieuMau.control, name: "slug" });
  const bieuTuongDangChon = useWatch({
    control: bieuMau.control,
    name: "icon",
  });
  const danhMucChaDangChon = useWatch({
    control: bieuMau.control,
    name: "parentId",
  });

  const taoDanhMuc = useTaoDanhMucQuanTri();
  const capNhatDanhMuc = useCapNhatDanhMucQuanTri();

  // Biến này lưu phép thay đổi phù hợp với chế độ đang mở.
  let phepThayDoi = taoDanhMuc;

  if (cheDoSua === true) {
    phepThayDoi = capNhatDanhMuc;
  }

  // Tập này chứa id của danh mục đang sửa và toàn bộ con cháu.
  let tapIdBiChan = new Set();

  if (danhMucDangSua !== null) {
    tapIdBiChan = timIdDanhMucCon(danhSachPhang, danhMucDangSua.id);
  }

  // Mảng này lưu các lựa chọn danh mục cha.
  const cacLuaChonDanhMucCha = [];

  for (const danhMuc of danhSachPhang) {
    if (tapIdBiChan.has(danhMuc.id) === true) {
      continue;
    }

    const khoangThut = taoKhoangThutDoSau(danhMuc.depth);

    // Biến này lưu tiền tố thể hiện cấp con của danh mục.
    let tienToCapCon = "";

    if (danhMuc.depth > 0) {
      tienToCapCon = "└ ";
    }

    cacLuaChonDanhMucCha.push(
      <option value={String(danhMuc.id)} key={danhMuc.id}>
        {khoangThut}
        {tienToCapCon}
        {danhMuc.name}
      </option>,
    );
  }

  const dangKyTen = bieuMau.register("name");
  const dangKySlug = bieuMau.register("slug");
  const dangKyCha = bieuMau.register("parentId");
  const dangKyThuTu = bieuMau.register("sortOrder");
  const cacLoi = bieuMau.formState.errors;

  // Hàm này gửi dữ liệu danh mục lên backend.
  function xuLyGuiDanhMuc(giaTri) {
    // Biến này lưu id danh mục cha sau khi chuyển sang số.
    let maDanhMucCha = null;

    if (giaTri.parentId !== "") {
      maDanhMucCha = Number(giaTri.parentId);
    }

    const duLieuGui = {
      name: giaTri.name,
      slug: giaTri.slug,
      parentId: maDanhMucCha,
      icon: giaTri.icon,
      sortOrder: giaTri.sortOrder,
    };

    if (cheDoSua === true) {
      duLieuGui.id = danhMucDangSua.id;

      phepThayDoi.mutate(duLieuGui, {
        onSuccess: thuocTinh.onClose,
      });

      return;
    }

    phepThayDoi.mutate(duLieuGui, {
      onSuccess: thuocTinh.onClose,
    });
  }

  // Hàm này chọn hoặc bỏ chọn một biểu tượng danh mục.
  function xuLyChonBieuTuong(tenBieuTuong) {
    bieuMau.setValue("icon", tenBieuTuong);
  }

  // Hàm này bỏ biểu tượng đang chọn.
  function xuLyBoBieuTuong() {
    bieuMau.setValue("icon", "");
  }

  // Mảng này lưu các nút biểu tượng trong bộ chọn.
  const cacNutBieuTuong = [];

  for (const tenBieuTuong of TEN_CAC_BIEU_TUONG) {
    // Hàm này chọn biểu tượng hiện tại.
    const xuLyChon = function () {
      xuLyChonBieuTuong(tenBieuTuong);
    };

    // Biến này cho biết biểu tượng hiện tại có đang được chọn hay không.
    let dangDuocChon = false;

    if (bieuTuongDangChon === tenBieuTuong) {
      dangDuocChon = true;
    }

    // Biến này lưu lớp CSS của nút biểu tượng.
    let lopNut = "icon-chip";

    if (dangDuocChon === true) {
      lopNut = "icon-chip selected";
    }

    cacNutBieuTuong.push(
      <button
        className={lopNut}
        type="button"
        key={tenBieuTuong}
        title={tenBieuTuong}
        aria-pressed={dangDuocChon}
        onClick={xuLyChon}
      >
        <BieuTuongDanhMuc name={tenBieuTuong} size={18} />
      </button>,
    );
  }

  // Phần tử này hiển thị lỗi của lần gửi gần nhất.
  let phanTuLoi = null;

  if (phepThayDoi.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(phepThayDoi.error)}</div>
      </div>
    );
  }

  // Biến này lưu slug xem trước khi người dùng chưa nhập slug.
  let slugXemTruoc = slugDangNhap;

  if (slugXemTruoc === "") {
    slugXemTruoc = taoSlugTuTen(tenDangNhap);
  }

  // Biến này lưu tiêu đề hộp thoại.
  let tieuDeHopThoai = "Thêm danh mục";

  if (cheDoSua === true) {
    tieuDeHopThoai = "Sửa danh mục “" + danhMucDangSua.name + "”";
  }

  // Biến này lưu nhãn của nút gửi.
  let nhanNutGui = "Thêm danh mục";

  if (cheDoSua === true) {
    nhanNutGui = "Lưu thay đổi";
  }

  // Phần tử này hiển thị biểu tượng chờ trên nút gửi.
  let phanTuBieuTuongGui = null;

  if (phepThayDoi.isPending === true) {
    phanTuBieuTuongGui = <LoaderCircle className="spin" size={16} />;
  }

  // Phần tử này hiển thị gợi ý slug khi trường chưa có lỗi.
  let phanTuGoiYSlug = null;

  if (cacLoi.slug === undefined) {
    phanTuGoiYSlug = (
      <p className="field-hint">
        Đường dẫn xem trước: /products?category={slugXemTruoc}. Bỏ trống để
        backend tự tạo từ tên.
      </p>
    );
  }

  // Phần tử này hiển thị gợi ý khi danh mục đang là danh mục con.
  let phanTuGoiYDanhMucCha = null;

  if (danhMucChaDangChon !== "") {
    phanTuGoiYDanhMucCha = (
      <p className="field-hint">
        Biểu tượng thường chỉ hiển thị ở danh mục gốc.
      </p>
    );
  }

  // Biến này lưu lớp CSS của nút bỏ biểu tượng.
  let lopNutBoBieuTuong = "icon-chip";

  if (bieuTuongDangChon === "") {
    lopNutBoBieuTuong = "icon-chip selected";
  }

  return (
    <HopThoaiQuanTri
      title={tieuDeHopThoai}
      onClose={thuocTinh.onClose}
      width={600}
      footer={
        <>
          <button className="btn" type="button" onClick={thuocTinh.onClose}>
            Huỷ
          </button>
          <button
            className="btn btn--primary"
            type="submit"
            form="category-form"
            disabled={phepThayDoi.isPending === true}
          >
            {phanTuBieuTuongGui}
            {nhanNutGui}
          </button>
        </>
      }
    >
      <form
        id="category-form"
        onSubmit={bieuMau.handleSubmit(xuLyGuiDanhMuc)}
        noValidate
      >
        <div className="admin-field-stack">
          <div className={layLopTruong(cacLoi.name !== undefined)}>
            <label className="required" htmlFor="category-name">
              Tên danh mục
            </label>
            <input
              className="input"
              id="category-name"
              name={dangKyTen.name}
              onChange={dangKyTen.onChange}
              onBlur={dangKyTen.onBlur}
              ref={dangKyTen.ref}
              placeholder="VD: Điện thoại & Phụ kiện"
              autoFocus
            />
            <LoiTruong error={cacLoi.name} />
          </div>

          <div className={layLopTruong(cacLoi.slug !== undefined)}>
            <label htmlFor="category-slug">Slug (đường dẫn)</label>
            <input
              className="input"
              id="category-slug"
              name={dangKySlug.name}
              onChange={dangKySlug.onChange}
              onBlur={dangKySlug.onBlur}
              ref={dangKySlug.ref}
              placeholder={slugXemTruoc}
            />
            <LoiTruong error={cacLoi.slug} />
            {phanTuGoiYSlug}
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="category-parent">Danh mục cha</label>
              <select
                className="select"
                id="category-parent"
                name={dangKyCha.name}
                onChange={dangKyCha.onChange}
                onBlur={dangKyCha.onBlur}
                ref={dangKyCha.ref}
              >
                <option value="">— Không có (danh mục gốc) —</option>
                {cacLuaChonDanhMucCha}
              </select>
            </div>

            <div className={layLopTruong(cacLoi.sortOrder !== undefined)}>
              <label htmlFor="category-order">Thứ tự hiển thị</label>
              <input
                className="input"
                id="category-order"
                type="number"
                min="0"
                name={dangKyThuTu.name}
                onChange={dangKyThuTu.onChange}
                onBlur={dangKyThuTu.onBlur}
                ref={dangKyThuTu.ref}
              />
              <LoiTruong error={cacLoi.sortOrder} />
            </div>
          </div>

          <div className="field">
            <label>Biểu tượng</label>
            {phanTuGoiYDanhMucCha}
            <div className="icon-picker">
              <button
                className={lopNutBoBieuTuong}
                type="button"
                title="Không dùng biểu tượng"
                aria-pressed={bieuTuongDangChon === ""}
                onClick={xuLyBoBieuTuong}
              >
                —
              </button>
              {cacNutBieuTuong}
            </div>
          </div>

          {phanTuLoi}
        </div>
      </form>
    </HopThoaiQuanTri>
  );
}

// Thành phần này hiển thị hộp thoại xác nhận xoá danh mục.
function HopThoaiXoaDanhMuc(thuocTinh) {
  const xoaDanhMuc = useXoaDanhMucQuanTri();
  const danhMuc = thuocTinh.category;

  // Hàm này xoá danh mục hiện tại.
  function xuLyXoaDanhMuc() {
    xoaDanhMuc.mutate(danhMuc.id, {
      onSuccess: thuocTinh.onClose,
    });
  }

  // Phần tử này hiển thị lỗi nếu danh mục không thể xoá.
  let phanTuLoi = null;

  if (xoaDanhMuc.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(xoaDanhMuc.error)}</div>
      </div>
    );
  }

  // Phần tử này hiển thị biểu tượng trên nút xoá.
  let phanTuBieuTuongXoa = <Trash2 size={16} />;

  if (xoaDanhMuc.isPending === true) {
    phanTuBieuTuongXoa = <LoaderCircle className="spin" size={16} />;
  }

  return (
    <HopThoaiQuanTri
      title="Xoá danh mục"
      onClose={thuocTinh.onClose}
      width={460}
      footer={
        <>
          <button className="btn" type="button" onClick={thuocTinh.onClose}>
            Huỷ
          </button>
          <button
            className="btn btn--danger"
            type="button"
            disabled={xoaDanhMuc.isPending === true}
            onClick={xuLyXoaDanhMuc}
          >
            {phanTuBieuTuongXoa}
            Xoá
          </button>
        </>
      }
    >
      <p>
        Bạn chắc chắn muốn xoá danh mục <strong>{danhMuc.name}</strong>?
      </p>
      <p className="muted">
        Chỉ xoá được danh mục không còn danh mục con và chưa có sản phẩm.
      </p>
      {phanTuLoi}
    </HopThoaiQuanTri>
  );
}

// Thành phần này hiển thị trang quản lý danh mục.
export default function TrangDanhMucQuanTri() {
  const ketQuaDanhMuc = useDanhSachDanhMucPhang();
  const ketQuaThongKe = useThongKeDanhMucQuanTri();

  // Biến này lưu số liệu thống kê sau khi kiểm tra dữ liệu.
  let duLieuThongKe = {};

  if (ketQuaThongKe.data !== null) {
    if (ketQuaThongKe.data !== undefined) {
      duLieuThongKe = ketQuaThongKe.data;
    }
  }

  const trangThaiTuKhoa = useState("");
  const tuKhoa = trangThaiTuKhoa[0];
  const capNhatTuKhoa = trangThaiTuKhoa[1];

  const trangThaiThuGon = useState(function () {
    return new Set();
  });
  const tapDangThuGon = trangThaiThuGon[0];
  const capNhatTapThuGon = trangThaiThuGon[1];

  const trangThaiDangSua = useState(null);
  const dangSua = trangThaiDangSua[0];
  const capNhatDangSua = trangThaiDangSua[1];

  const trangThaiDangXoa = useState(null);
  const dangXoa = trangThaiDangXoa[0];
  const capNhatDangXoa = trangThaiDangXoa[1];

  // Biến này lưu danh sách danh mục phẳng sau khi kiểm tra dữ liệu.
  let danhSachDanhMuc = [];

  if (Array.isArray(ketQuaDanhMuc.data) === true) {
    danhSachDanhMuc = ketQuaDanhMuc.data;
  }

  // Bản đồ này tra cứu nhanh một danh mục theo id.
  const banDoDanhMuc = new Map();

  for (const danhMuc of danhSachDanhMuc) {
    banDoDanhMuc.set(danhMuc.id, danhMuc);
  }

  // Bản đồ này đếm số danh mục con trực tiếp của từng danh mục.
  const soLuongDanhMucCon = new Map();

  for (const danhMuc of danhSachDanhMuc) {
    if (danhMuc.parentId === null) {
      continue;
    }

    if (danhMuc.parentId === undefined) {
      continue;
    }

    let soConHienTai = soLuongDanhMucCon.get(danhMuc.parentId);

    if (soConHienTai === undefined) {
      soConHienTai = 0;
    }

    soLuongDanhMucCon.set(danhMuc.parentId, soConHienTai + 1);
  }

  const tuKhoaDaCat = tuKhoa.trim();
  const tuKhoaDaChuanHoa = tuKhoaDaCat.toLowerCase();

  // Mảng này lưu các danh mục cần hiển thị sau khi lọc và thu gọn.
  const danhSachHienThi = [];

  if (tuKhoaDaChuanHoa !== "") {
    // Tập này giữ lại danh mục khớp và toàn bộ tổ tiên của nó.
    const tapGiuLai = new Set();

    for (const danhMuc of danhSachDanhMuc) {
      const tenChuanHoa = danhMuc.name.toLowerCase();
      const slugChuanHoa = danhMuc.slug.toLowerCase();

      // Biến này cho biết danh mục hiện tại có khớp từ khoá hay không.
      let khopTuKhoa = false;

      if (tenChuanHoa.includes(tuKhoaDaChuanHoa) === true) {
        khopTuKhoa = true;
      }

      if (slugChuanHoa.includes(tuKhoaDaChuanHoa) === true) {
        khopTuKhoa = true;
      }

      if (khopTuKhoa === false) {
        continue;
      }

      let danhMucDangXet = danhMuc;

      while (danhMucDangXet !== undefined) {
        tapGiuLai.add(danhMucDangXet.id);
        danhMucDangXet = banDoDanhMuc.get(danhMucDangXet.parentId);
      }
    }

    for (const danhMuc of danhSachDanhMuc) {
      if (tapGiuLai.has(danhMuc.id) === true) {
        danhSachHienThi.push(danhMuc);
      }
    }
  } else {
    for (const danhMuc of danhSachDanhMuc) {
      // Biến này cho biết danh mục hiện tại bị ẩn bởi một tổ tiên đang thu gọn.
      let biAn = false;
      let danhMucCha = banDoDanhMuc.get(danhMuc.parentId);

      while (danhMucCha !== undefined) {
        if (tapDangThuGon.has(danhMucCha.id) === true) {
          biAn = true;
          break;
        }

        danhMucCha = banDoDanhMuc.get(danhMucCha.parentId);
      }

      if (biAn === false) {
        danhSachHienThi.push(danhMuc);
      }
    }
  }

  // Hàm này mở hoặc đóng một nhánh danh mục.
  function xuLyThuGonDanhMuc(maDanhMuc) {
    capNhatTapThuGon(function (tapCu) {
      const tapMoi = new Set(tapCu);

      if (tapMoi.has(maDanhMuc) === true) {
        tapMoi.delete(maDanhMuc);
      } else {
        tapMoi.add(maDanhMuc);
      }

      return tapMoi;
    });
  }

  // Mảng này lưu giao diện từng dòng danh mục.
  const cacDongDanhMuc = [];

  for (const danhMuc of danhSachHienThi) {
    // Biến này lưu số danh mục con trực tiếp của dòng hiện tại.
    let soCon = soLuongDanhMucCon.get(danhMuc.id);

    if (soCon === undefined) {
      soCon = 0;
    }

    // Hàm này thu gọn hoặc mở nhánh danh mục hiện tại.
    const xuLyThuGon = function () {
      xuLyThuGonDanhMuc(danhMuc.id);
    };

    // Hàm này mở hộp thoại thêm danh mục con.
    const xuLyThemCon = function () {
      capNhatDangSua({
        mode: "create",
        parentId: danhMuc.id,
        category: null,
      });
    };

    // Hàm này mở hộp thoại sửa danh mục hiện tại.
    const xuLySua = function () {
      capNhatDangSua({
        mode: "edit",
        parentId: null,
        category: danhMuc,
      });
    };

    // Hàm này mở hộp thoại xoá danh mục hiện tại.
    const xuLyXoa = function () {
      capNhatDangXoa(danhMuc);
    };

    // Phần tử này hiển thị nút thu gọn nếu danh mục có con.
    let phanTuThuGon = <span className="cat-toggle-spacer" />;

    if (soCon > 0) {
      if (tuKhoaDaChuanHoa === "") {
        // Biến này cho biết nhánh hiện tại đang thu gọn hay không.
        let dangThuGon = false;

        if (tapDangThuGon.has(danhMuc.id) === true) {
          dangThuGon = true;
        }

        // Phần tử này hiển thị biểu tượng mở hoặc đóng nhánh.
        let phanTuBieuTuong = <ChevronDown size={16} />;

        if (dangThuGon === true) {
          phanTuBieuTuong = <ChevronRight size={16} />;
        }

        phanTuThuGon = (
          <button
            className="cat-toggle"
            type="button"
            aria-label="Mở hoặc thu gọn danh mục con"
            onClick={xuLyThuGon}
          >
            {phanTuBieuTuong}
          </button>
        );
      }
    }

    // Phần tử này hiển thị biểu tượng hoặc dấu cấp con.
    let phanTuBieuTuongDanhMuc = (
      <CornerDownRight size={14} className="muted" />
    );

    if (danhMuc.depth === 0) {
      phanTuBieuTuongDanhMuc = (
        <span className="icon-chip">
          <BieuTuongDanhMuc name={danhMuc.icon} size={16} />
        </span>
      );
    }

    // Biến này lưu tên danh mục cha.
    let tenDanhMucCha = "—";
    const danhMucCha = banDoDanhMuc.get(danhMuc.parentId);

    if (danhMucCha !== undefined) {
      tenDanhMucCha = danhMucCha.name;
    }

    // Phần tử này hiển thị số danh mục con.
    let phanTuSoCon = <span className="muted">0</span>;

    if (soCon > 0) {
      phanTuSoCon = (
        <span className="status status--confirmed">{soCon}</span>
      );
    }

    // Hàm này xử lý khi người dùng mở danh mục trên cửa hàng.
    const duongDanXemDanhMuc =
      "/products?category=" + encodeURIComponent(danhMuc.slug);

    // Biến này lưu độ đậm của tên danh mục theo cấp.
    let doDamTen = 500;

    if (danhMuc.depth === 0) {
      doDamTen = 600;
    }

    cacDongDanhMuc.push(
      <tr key={danhMuc.id}>
        <td>
          <div className="tree-name">
            <span
              className="tree-indent"
              style={{ width: danhMuc.depth * 24 }}
            />
            {phanTuThuGon}
            {phanTuBieuTuongDanhMuc}
            <strong style={{ fontWeight: doDamTen }}>{danhMuc.name}</strong>
          </div>
        </td>
        <td>
          <code className="cell-sub">{danhMuc.slug}</code>
        </td>
        <td className="muted">{tenDanhMucCha}</td>
        <td>{danhMuc.sortOrder}</td>
        <td>{phanTuSoCon}</td>
        <td>
          <div className="table-actions">
            <Link
              className="btn btn--ghost btn--sm"
              to={duongDanXemDanhMuc}
              target="_blank"
              rel="noreferrer"
              title="Xem trên cửa hàng"
            >
              <ExternalLink size={14} />
            </Link>
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              title="Thêm danh mục con"
              onClick={xuLyThemCon}
            >
              <Plus size={14} /> Con
            </button>
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              title="Sửa danh mục"
              onClick={xuLySua}
            >
              <Pencil size={14} />
            </button>
            <button
              className="btn btn--danger btn--sm"
              type="button"
              title="Xoá danh mục"
              onClick={xuLyXoa}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>,
    );
  }

  // Phần tử này hiển thị trạng thái đang tải danh mục.
  let phanTuDangTai = null;

  if (ketQuaDanhMuc.isLoading === true) {
    phanTuDangTai = (
      <div className="admin-state">
        <LoaderCircle className="spin" size={24} />
        <span>Đang tải danh mục…</span>
      </div>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được danh mục.
  let phanTuLoi = null;

  if (ketQuaDanhMuc.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>Không tải được danh mục. Vui lòng thử lại.</div>
      </div>
    );
  }

  // Phần tử này hiển thị trạng thái danh sách rỗng.
  let phanTuRong = null;

  if (ketQuaDanhMuc.isLoading === false) {
    if (ketQuaDanhMuc.isError === false) {
      if (danhSachHienThi.length === 0) {
        // Biến này lưu thông điệp khi danh sách rỗng.
        let thongDiepRong = "Chưa có danh mục nào.";

        if (tuKhoaDaChuanHoa !== "") {
          thongDiepRong = "Không có danh mục khớp từ khoá.";
        }

        phanTuRong = (
          <div className="admin-state">
            <FolderTree size={34} />
            <span>{thongDiepRong}</span>
          </div>
        );
      }
    }
  }

  // Hàm này mở hộp thoại thêm danh mục gốc.
  function xuLyThemDanhMucGoc() {
    capNhatDangSua({
      mode: "create",
      parentId: null,
      category: null,
    });
  }

  // Hàm này cập nhật từ khoá tìm kiếm.
  function xuLyThayDoiTuKhoa(suKienNhap) {
    capNhatTuKhoa(suKienNhap.target.value);
  }

  // Phần tử này hiển thị hộp thoại thêm hoặc sửa danh mục.
  let phanTuHopThoaiSua = null;

  if (dangSua !== null) {
    phanTuHopThoaiSua = (
      <HopThoaiDanhMuc
        editing={dangSua}
        flat={danhSachDanhMuc}
        onClose={function () {
          capNhatDangSua(null);
        }}
      />
    );
  }

  // Phần tử này hiển thị hộp thoại xoá danh mục.
  let phanTuHopThoaiXoa = null;

  if (dangXoa !== null) {
    phanTuHopThoaiXoa = (
      <HopThoaiXoaDanhMuc
        category={dangXoa}
        onClose={function () {
          capNhatDangXoa(null);
        }}
      />
    );
  }

  // Phần tử này hiển thị bảng danh mục khi có dữ liệu.
  let phanTuBang = null;

  if (cacDongDanhMuc.length > 0) {
    phanTuBang = (
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th>Danh mục cha</th>
              <th>Thứ tự</th>
              <th>Con</th>
              <th className="num">Thao tác</th>
            </tr>
          </thead>
          <tbody>{cacDongDanhMuc}</tbody>
        </table>
      </div>
    );
  }

  // Phần tử này hiển thị lỗi khi không tải được số liệu thống kê.
  let phanTuLoiThongKe = null;

  if (ketQuaThongKe.isError === true) {
    phanTuLoiThongKe = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>Không tải được số liệu thống kê danh mục.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="panel__head">
        <div>
          <p className="eyebrow-free">Catalog</p>
          <h1>Quản lý danh mục</h1>
        </div>
        <div className="panel__head-actions">
          <button
            className="btn btn--primary btn--sm"
            type="button"
            onClick={xuLyThemDanhMucGoc}
          >
            <Plus size={15} /> Thêm danh mục
          </button>
        </div>
      </div>

      <div className="stat-grid stat-grid--dashboard">
        <OChiSoQuanTri
          icon={FolderTree}
          tone="var(--green)"
          value={laySoLieuQuanTri(duLieuThongKe.totalCategories)}
          label="Tổng danh mục"
          meta={"Độ sâu tối đa: " + laySoLieuQuanTri(duLieuThongKe.maxDepth)}
        />
        <OChiSoQuanTri
          icon={Folder}
          tone="var(--blue)"
          value={laySoLieuQuanTri(duLieuThongKe.rootCategories)}
          label="Danh mục gốc"
          meta="Hiển thị trực tiếp trên thanh danh mục"
        />
        <OChiSoQuanTri
          icon={CornerDownRight}
          tone="var(--ink-2)"
          value={laySoLieuQuanTri(duLieuThongKe.leafCategories)}
          label="Danh mục lá"
          meta="Không còn danh mục con"
        />
        <OChiSoQuanTri
          icon={Check}
          tone="var(--green-dark)"
          value={laySoLieuQuanTri(duLieuThongKe.categoriesWithProducts)}
          label="Có sản phẩm"
          meta="Bao gồm sản phẩm ở danh mục con"
        />
        <OChiSoQuanTri
          icon={TriangleAlert}
          tone="var(--amber)"
          value={laySoLieuQuanTri(duLieuThongKe.emptyCategories)}
          label="Chưa có sản phẩm"
          meta="Cần bổ sung sản phẩm hoặc gộp danh mục"
        />
      </div>

      {phanTuLoiThongKe}

      <div className="panel-toolbar">
        <label className="search-inline">
          <Search size={15} className="muted" />
          <input
            type="search"
            value={tuKhoa}
            onChange={xuLyThayDoiTuKhoa}
            placeholder="Tìm theo tên hoặc slug…"
            aria-label="Tìm danh mục"
          />
        </label>
      </div>

      <section className="panel-card">
        {phanTuDangTai}
        {phanTuLoi}
        {phanTuRong}
        {phanTuBang}
      </section>

      {phanTuHopThoaiSua}
      {phanTuHopThoaiXoa}
    </div>
  );
}
