import { useState } from "react";
/* eslint-disable react-hooks/refs -- react-hook-form trả về ref cho input không kiểm soát; quy tắc hiểu nhầm cả đối tượng register là ref. */
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import HopThoaiQuanTri from "./AdminModal";
import {
  layThongBaoLoi,
  taoChuoiThuocTinhPhienBan,
  taoDoiTuongThuocTinh,
  taoDongThuocTinh,
} from "../../lib/adminHelpers";
import { phienBanSchema } from "../../lib/adminSchemas";
import { dinhDangTien } from "../../lib/formatMoney";
import {
  useCapNhatPhienBanQuanTri,
  useTaoPhienBanQuanTri,
  useXoaPhienBanQuanTri,
} from "../../hooks/useAdminProducts";

// Hàm này trả về lớp CSS của một trường dựa trên trạng thái lỗi.
function layLopTruong(coLoi) {
  if (coLoi === true) {
    return "field has-error";
  }

  return "field";
}

// Hàm này đọc lỗi của một dòng thuộc tính để hiển thị.
function layLoiDongThuocTinh(cacLoi, chiSo, tenTruong) {
  if (cacLoi.attributes === undefined) {
    return null;
  }

  const loiCuaDong = cacLoi.attributes[chiSo];

  if (loiCuaDong === undefined) {
    return null;
  }

  const loiCuaTruong = loiCuaDong[tenTruong];

  if (loiCuaTruong === undefined) {
    return null;
  }

  return loiCuaTruong;
}

// Thành phần này hiển thị lỗi của một trường nếu có.
function LoiTruong(thuocTinh) {
  const loi = thuocTinh.error;

  if (loi === null) {
    return null;
  }

  if (loi === undefined) {
    return null;
  }

  return (
    <p className="field-error" role="alert">
      {loi.message}
    </p>
  );
}

// Thành phần này hiển thị biểu mẫu thêm hoặc sửa một biến thể.
function HopThoaiBienThe(thuocTinh) {
  const sanPham = thuocTinh.product;
  const phienBanDangSua = thuocTinh.variant;

  // Biến này cho biết biểu mẫu đang sửa một biến thể đã có hay không.
  let laSua = false;

  if (phienBanDangSua !== null) {
    if (phienBanDangSua.id !== undefined) {
      laSua = true;
    }
  }

  const taoPhienBan = useTaoPhienBanQuanTri();
  const capNhatPhienBan = useCapNhatPhienBanQuanTri();

  // Biến này lưu giá trị ban đầu của biểu mẫu.
  let giaTriBanDau = {
    sku: "",
    attributes: [{ key: "", value: "" }],
    priceMinor: "",
    stockQuantity: "",
  };

  if (laSua === true) {
    if (typeof phienBanDangSua.sku === "string") {
      giaTriBanDau.sku = phienBanDangSua.sku;
    }

    giaTriBanDau.attributes = taoDongThuocTinh(
      phienBanDangSua.attributes,
    );
    giaTriBanDau.priceMinor = String(phienBanDangSua.priceMinor);
    giaTriBanDau.stockQuantity = String(
      phienBanDangSua.stockQuantity,
    );
  }

  const bieuMau = useForm({
    resolver: zodResolver(phienBanSchema),
    defaultValues: giaTriBanDau,
  });

  const mangThuocTinh = useFieldArray({
    control: bieuMau.control,
    name: "attributes",
  });

  const cacLoi = bieuMau.formState.errors;

  // Biến này cho biết có yêu cầu nào đang được gửi hay không.
  let dangGui = false;

  if (taoPhienBan.isPending === true) {
    dangGui = true;
  }

  if (capNhatPhienBan.isPending === true) {
    dangGui = true;
  }

  // Biến này lưu lỗi của yêu cầu gần nhất.
  let loiYeuCau = null;

  if (taoPhienBan.error !== null) {
    loiYeuCau = taoPhienBan.error;
  }

  if (capNhatPhienBan.error !== null) {
    loiYeuCau = capNhatPhienBan.error;
  }

  // Hàm này gửi dữ liệu biến thể lên backend.
  function xuLyGuiBienThe(giaTri) {
    // Biến này lưu đường dẫn ảnh cũ của biến thể.
    let duongDanAnh = null;

    if (laSua === true) {
      duongDanAnh = phienBanDangSua.imageUrl;
    }

    const duLieuGui = {
      productId: sanPham.id,
      sku: null,
      attributes: taoDoiTuongThuocTinh(giaTri.attributes),
      priceMinor: giaTri.priceMinor,
      stockQuantity: giaTri.stockQuantity,
      imageUrl: duongDanAnh,
    };

    const maSku = giaTri.sku.trim();

    if (maSku !== "") {
      duLieuGui.sku = maSku;
    }

    if (laSua === true) {
      duLieuGui.variantId = phienBanDangSua.id;

      capNhatPhienBan.mutate(duLieuGui, {
        onSuccess: thuocTinh.onClose,
      });

      return;
    }

    taoPhienBan.mutate(duLieuGui, {
      onSuccess: thuocTinh.onClose,
    });
  }

  // Phần tử này hiển thị lỗi chung của biểu mẫu.
  let phanTuLoi = null;

  if (loiYeuCau !== null) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(loiYeuCau)}</div>
      </div>
    );
  }

  // Mảng này lưu giao diện của từng dòng thuộc tính.
  const cacDongThuocTinh = [];

  let chiSo = 0;

  while (chiSo < mangThuocTinh.fields.length) {
    const field = mangThuocTinh.fields[chiSo];

    const loiTen = layLoiDongThuocTinh(cacLoi, chiSo, "key");
    const loiGiaTri = layLoiDongThuocTinh(cacLoi, chiSo, "value");

    // Biến này giữ vị trí dòng để hàm xoá dùng đúng chỉ số.
    const viTriDong = chiSo;

    // Hàm này xoá dòng thuộc tính hiện tại.
    function xuLyXoaDong() {
      mangThuocTinh.remove(viTriDong);
    }

    // Hai biến này lưu cấu hình đăng ký của hai ô thuộc tính trong dòng.
    const dangKyTenThuocTinh = bieuMau.register(
      "attributes." + chiSo + ".key",
    );
    const dangKyGiaTriThuocTinh = bieuMau.register(
      "attributes." + chiSo + ".value",
    );

    cacDongThuocTinh.push(
      <div className="attr-row" key={field.id}>
        <div>
          <input
            className="input"
            placeholder="Tên (vd: color)"
            maxLength={100}
            aria-label="Tên thuộc tính"
            name={dangKyTenThuocTinh.name}
            onChange={dangKyTenThuocTinh.onChange}
            onBlur={dangKyTenThuocTinh.onBlur}
            ref={dangKyTenThuocTinh.ref}
          />
          <LoiTruong error={loiTen} />
        </div>
        <div>
          <input
            className="input"
            placeholder="Giá trị (vd: Đen)"
            maxLength={100}
            aria-label="Giá trị thuộc tính"
            name={dangKyGiaTriThuocTinh.name}
            onChange={dangKyGiaTriThuocTinh.onChange}
            onBlur={dangKyGiaTriThuocTinh.onBlur}
            ref={dangKyGiaTriThuocTinh.ref}
          />
          <LoiTruong error={loiGiaTri} />
        </div>
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          title="Xoá thuộc tính"
          onClick={xuLyXoaDong}
        >
          <X size={16} />
        </button>
      </div>,
    );

    chiSo = chiSo + 1;
  }

  // Hàm này thêm một dòng thuộc tính trống.
  function xuLyThemDong() {
    mangThuocTinh.append({ key: "", value: "" });
  }

  // Phần tử này hiển thị nút gửi biểu mẫu với trạng thái phù hợp.
  let nhanNutGui = "Thêm biến thể";

  if (laSua === true) {
    nhanNutGui = "Lưu thay đổi";
  }

  // Biến này lưu tiêu đề của hộp thoại biến thể.
  let tieuDeHopThoai = "Thêm biến thể";

  if (laSua === true) {
    tieuDeHopThoai = "Sửa biến thể";
  }

  // Phần tử này hiển thị biểu tượng chờ trên nút gửi.
  let phanTuBieuTuongGui = null;

  if (dangGui === true) {
    phanTuBieuTuongGui = <LoaderCircle className="spin" size={16} />;
  }

  // Phần tử này hiển thị gợi ý SKU khi trường chưa có lỗi.
  let phanTuGoiYSku = null;

  if (cacLoi.sku === undefined) {
    phanTuGoiYSku = (
      <p className="field-hint">
        Không bắt buộc. SKU phải duy nhất trên toàn hệ thống.
      </p>
    );
  }

  const dangKyGia = bieuMau.register("priceMinor");
  const dangKyTonKho = bieuMau.register("stockQuantity");
  const dangKySku = bieuMau.register("sku");

  return (
    <HopThoaiQuanTri
      title={tieuDeHopThoai}
      onClose={thuocTinh.onClose}
      width={620}
      footer={
        <>
          <button
            className="btn"
            type="button"
            onClick={thuocTinh.onClose}
          >
            Huỷ
          </button>
          <button
            className="btn btn--primary"
            type="submit"
            form="variant-form"
            disabled={dangGui}
          >
            {phanTuBieuTuongGui}
            {nhanNutGui}
          </button>
        </>
      }
    >
      <form
        id="variant-form"
        onSubmit={bieuMau.handleSubmit(xuLyGuiBienThe)}
        noValidate
      >
        <div className="form-grid">
          <div className={layLopTruong(cacLoi.priceMinor !== undefined)}>
            <label className="required" htmlFor="variant-price">
              Giá bán (₫)
            </label>
            <input
              className="input"
              id="variant-price"
              type="number"
              min="0"
              step="1"
              autoFocus
              name={dangKyGia.name}
              onChange={dangKyGia.onChange}
              onBlur={dangKyGia.onBlur}
              ref={dangKyGia.ref}
            />
            <LoiTruong error={cacLoi.priceMinor} />
          </div>
          <div className={layLopTruong(cacLoi.stockQuantity !== undefined)}>
            <label className="required" htmlFor="variant-stock">
              Tồn kho
            </label>
            <input
              className="input"
              id="variant-stock"
              type="number"
              min="0"
              step="1"
              name={dangKyTonKho.name}
              onChange={dangKyTonKho.onChange}
              onBlur={dangKyTonKho.onBlur}
              ref={dangKyTonKho.ref}
            />
            <LoiTruong error={cacLoi.stockQuantity} />
          </div>
        </div>

        <div className={layLopTruong(cacLoi.sku !== undefined)}>
          <label htmlFor="variant-sku">SKU</label>
          <input
            className="input"
            id="variant-sku"
            maxLength={64}
            placeholder="VD: AO-DEN-L"
            name={dangKySku.name}
            onChange={dangKySku.onChange}
            onBlur={dangKySku.onBlur}
            ref={dangKySku.ref}
          />
          <LoiTruong error={cacLoi.sku} />
          {phanTuGoiYSku}
        </div>

        <div className="field admin-field-gap">
          <label>Thuộc tính</label>
          <p className="field-hint">
            VD: color = Đen, size = L. Bỏ trống nếu sản phẩm chỉ có một
            loại.
          </p>
          {cacDongThuocTinh}
          <button
            className="btn btn--sm"
            type="button"
            onClick={xuLyThemDong}
          >
            <Plus size={14} /> Thêm thuộc tính
          </button>
        </div>

        {phanTuLoi}
      </form>
    </HopThoaiQuanTri>
  );
}

// Thành phần này hiển thị hộp thoại xác nhận xoá biến thể.
function HopThoaiXoaBienThe(thuocTinh) {
  const xoaPhienBan = useXoaPhienBanQuanTri();
  const phienBan = thuocTinh.variant;
  const sanPham = thuocTinh.product;

  // Biến này lưu chuỗi thuộc tính của biến thể.
  const chuoiThuocTinh = taoChuoiThuocTinhPhienBan(
    phienBan.attributes,
  );

  // Biến này lưu tên hiển thị của biến thể.
  let tenBienThe = "#" + phienBan.id;

  if (phienBan.sku !== null) {
    if (phienBan.sku !== undefined) {
      if (phienBan.sku !== "") {
        tenBienThe = phienBan.sku;
      }
    }
  }

  // Phần tử này hiển thị thuộc tính nếu biến thể có thuộc tính.
  let phanTuThuocTinh = null;

  if (chuoiThuocTinh !== "") {
    phanTuThuocTinh = " (" + chuoiThuocTinh + ")";
  }

  // Hàm này xoá biến thể khỏi sản phẩm.
  function xuLyXoaBienThe() {
    const duLieuXoa = {
      productId: sanPham.id,
      variantId: phienBan.id,
    };

    xoaPhienBan.mutate(duLieuXoa, {
      onSuccess: thuocTinh.onClose,
    });
  }

  // Phần tử này hiển thị lỗi nếu không xoá được biến thể.
  let phanTuLoi = null;

  if (xoaPhienBan.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(xoaPhienBan.error)}</div>
      </div>
    );
  }

  // Phần tử này hiển thị biểu tượng trên nút xoá.
  let phanTuBieuTuongXoa = <Trash2 size={16} />;

  if (xoaPhienBan.isPending === true) {
    phanTuBieuTuongXoa = <LoaderCircle className="spin" size={16} />;
  }

  return (
    <HopThoaiQuanTri
      title="Xoá biến thể"
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
            disabled={xoaPhienBan.isPending === true}
            onClick={xuLyXoaBienThe}
          >
            {phanTuBieuTuongXoa}
            Xoá
          </button>
        </>
      }
    >
      <p>
        Xoá biến thể <strong>{tenBienThe}</strong>
        {phanTuThuocTinh}?
      </p>
      <p className="muted">
        Biến thể đã có trong đơn hàng sẽ không thể xoá.
      </p>
      {phanTuLoi}
    </HopThoaiQuanTri>
  );
}

// Thành phần này hiển thị bảng biến thể của một sản phẩm.
export default function QuanLyBienTheQuanTri(thuocTinh) {
  const sanPham = thuocTinh.product;

  // Biến này cho biết bảng có bị khoá thao tác hay không.
  let dangKhoa = false;

  if (thuocTinh.disabled === true) {
    dangKhoa = true;
  }

  // Trạng thái này lưu biến thể đang được thêm hoặc sửa.
  const trangThaiDangSua = useState(null);

  // Biến này lưu biến thể đang được thêm hoặc sửa.
  const dangSua = trangThaiDangSua[0];

  // Biến này lưu hàm cập nhật biến thể đang sửa.
  const capNhatDangSua = trangThaiDangSua[1];

  // Trạng thái này lưu biến thể đang được xoá.
  const trangThaiDangXoa = useState(null);

  // Biến này lưu biến thể đang được xoá.
  const dangXoa = trangThaiDangXoa[0];

  // Biến này lưu hàm cập nhật biến thể đang xoá.
  const capNhatDangXoa = trangThaiDangXoa[1];

  // Biến này lưu danh sách biến thể đã kiểm tra kiểu dữ liệu.
  let danhSachBienThe = [];

  if (Array.isArray(sanPham.variants) === true) {
    danhSachBienThe = sanPham.variants;
  }

  // Hàm này mở biểu mẫu thêm biến thể mới.
  function xuLyThemBienThe() {
    capNhatDangSua({});
  }

  // Mảng này lưu giao diện của từng dòng biến thể.
  const cacDongBienThe = [];

  for (const phienBan of danhSachBienThe) {
    const cacCapThuocTinh = Object.entries(phienBan.attributes);

    // Mảng này lưu các nhãn thuộc tính của biến thể.
    const cacNhanThuocTinh = [];

    for (const capThuocTinh of cacCapThuocTinh) {
      cacNhanThuocTinh.push(
        <span className="attr-chip" key={capThuocTinh[0]}>
          {capThuocTinh[0]}: {capThuocTinh[1]}
        </span>,
      );
    }

    // Phần tử này hiển thị thuộc tính hoặc nhãn mặc định.
    let phanTuThuocTinh = (
      <span className="muted">Mặc định</span>
    );

    if (cacNhanThuocTinh.length > 0) {
      phanTuThuocTinh = (
        <div className="attr-chips">{cacNhanThuocTinh}</div>
      );
    }

    // Biến này lưu tên hiển thị của SKU.
    let tenSku = "—";

    if (phienBan.sku !== null) {
      if (phienBan.sku !== undefined) {
        if (phienBan.sku !== "") {
          tenSku = phienBan.sku;
        }
      }
    }

    // Phần tử này hiển thị tình trạng tồn kho.
    let phanTuTonKho = (
      <span className="status status--muted">Hết hàng</span>
    );

    if (phienBan.stockQuantity > 0) {
      phanTuTonKho = <span>{phienBan.stockQuantity}</span>;
    }

    // Biến này cho biết không được xoá biến thể cuối cùng.
    let khongDuocXoa = false;

    if (danhSachBienThe.length <= 1) {
      khongDuocXoa = true;
    }

    // Biến này cho biết nút xoá có bị khoá hay không.
    let khongChoXoa = dangKhoa;

    if (khongDuocXoa === true) {
      khongChoXoa = true;
    }

    // Biến này lưu chú thích của nút xoá.
    let tieuDeNutXoa = "Xoá biến thể";

    if (khongDuocXoa === true) {
      tieuDeNutXoa = "Không thể xoá biến thể cuối cùng của sản phẩm";
    }

    // Hàm này mở hộp thoại xoá biến thể hiện tại.
    function xuLyMoXoa() {
      capNhatDangXoa(phienBan);
    }

    // Hàm này mở biểu mẫu sửa biến thể hiện tại.
    function xuLyMoSua() {
      capNhatDangSua(phienBan);
    }

    cacDongBienThe.push(
      <tr key={phienBan.id}>
        <td>
          <strong>{tenSku}</strong>
          <div className="cell-sub">#{phienBan.id}</div>
        </td>
        <td>{phanTuThuocTinh}</td>
        <td>{dinhDangTien(phienBan.priceMinor)}</td>
        <td>{phanTuTonKho}</td>
        <td>
          <div className="table-actions">
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              title="Sửa biến thể"
              disabled={dangKhoa}
              onClick={xuLyMoSua}
            >
              <Pencil size={15} />
            </button>
            <button
              className="btn btn--danger btn--sm"
              type="button"
              disabled={khongChoXoa}
              title={tieuDeNutXoa}
              onClick={xuLyMoXoa}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>,
    );
  }

  // Phần tử này hiển thị hộp thoại thêm hoặc sửa biến thể.
  let phanTuHopThoaiSua = null;

  if (dangSua !== null) {
    let phienBanCanSua = null;

    if (dangSua.id !== undefined) {
      phienBanCanSua = dangSua;
    }

    phanTuHopThoaiSua = (
      <HopThoaiBienThe
        product={sanPham}
        variant={phienBanCanSua}
        onClose={function () {
          capNhatDangSua(null);
        }}
      />
    );
  }

  // Phần tử này hiển thị hộp thoại xoá biến thể.
  let phanTuHopThoaiXoa = null;

  if (dangXoa !== null) {
    phanTuHopThoaiXoa = (
      <HopThoaiXoaBienThe
        product={sanPham}
        variant={dangXoa}
        onClose={function () {
          capNhatDangXoa(null);
        }}
      />
    );
  }

  return (
    <section className="panel-card">
      <div className="panel-card__head">
        <div>
          <h2>Biến thể</h2>
          <p className="cell-sub">
            {danhSachBienThe.length} biến thể · phải còn ít nhất một biến
            thể
          </p>
        </div>
        <button
          className="btn btn--sm"
          type="button"
          disabled={dangKhoa}
          onClick={xuLyThemBienThe}
        >
          <Plus size={14} /> Thêm biến thể
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Thuộc tính</th>
              <th>Giá bán</th>
              <th>Tồn kho</th>
              <th className="num">Thao tác</th>
            </tr>
          </thead>
          <tbody>{cacDongBienThe}</tbody>
        </table>
      </div>

      {phanTuHopThoaiSua}
      {phanTuHopThoaiXoa}
    </section>
  );
}
