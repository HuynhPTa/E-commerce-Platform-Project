import { useEffect } from "react";
/* eslint-disable react-hooks/refs -- react-hook-form trả về ref cho input không kiểm soát; quy tắc hiểu nhầm cả đối tượng register là ref. */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { LoaderCircle, Save, TriangleAlert } from "lucide-react";
import { useDanhSachDanhMucPhang } from "../../hooks/useAdminCategories";
import {
  sanPhamSchema,
  sanPhamTaoMoiSchema,
} from "../../lib/adminSchemas";

// Hàm này tạo khoảng thụt đầu dòng theo độ sâu của danh mục.
function taoKhoangThutDoSau(doSau) {
  let khoangThut = "";

  let chiSo = 0;

  while (chiSo < doSau) {
    khoangThut = khoangThut + "   ";
    chiSo = chiSo + 1;
  }

  return khoangThut;
}

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

// Thành phần này hiển thị biểu mẫu thông tin sản phẩm.
export default function BieuMauSanPhamQuanTri(thuocTinh) {
  const cheDo = thuocTinh.mode;

  // Biến này cho biết biểu mẫu đang ở chế độ tạo mới hay không.
  let laTaoMoi = false;

  if (cheDo === "create") {
    laTaoMoi = true;
  }

  // Biến này lưu sản phẩm đang sửa, mặc định là null khi tạo mới.
  let sanPham = null;

  if (thuocTinh.product !== undefined) {
    sanPham = thuocTinh.product;
  }

  // Biến này cho biết biểu mẫu có bị khoá hay không.
  let dangKhoa = false;

  if (thuocTinh.disabled === true) {
    dangKhoa = true;
  }

  // Biến này lưu đường dẫn quay lại danh sách sản phẩm.
  let duongDanCoSo = "/admin/products";

  if (thuocTinh.basePath !== undefined) {
    duongDanCoSo = thuocTinh.basePath;
  }

  // Hook này lấy danh sách danh mục phẳng để đổ vào ô chọn.
  const ketQuaDanhMuc = useDanhSachDanhMucPhang();

  // Biến này lưu danh sách danh mục đã kiểm tra kiểu dữ liệu.
  let danhSachDanhMuc = [];

  if (Array.isArray(ketQuaDanhMuc.data) === true) {
    danhSachDanhMuc = ketQuaDanhMuc.data;
  }

  // Biến này cho biết danh mục vẫn đang tải.
  const dangTaiDanhMuc = ketQuaDanhMuc.isLoading;

  // Biến này cho biết ô chọn danh mục có bị khoá hay không.
  let khoaChonDanhMuc = dangKhoa;

  if (dangTaiDanhMuc === true) {
    khoaChonDanhMuc = true;
  }

  // Biến này lưu bộ kiểm tra dữ liệu theo chế độ của biểu mẫu.
  let boKiemTra = sanPhamSchema;

  if (laTaoMoi === true) {
    boKiemTra = sanPhamTaoMoiSchema;
  }

  // Khởi tạo biểu mẫu với giá trị ban đầu phù hợp từng chế độ.
  let giaTriBanDau = {
    name: "",
    description: "",
    categoryId: "",
    sku: "",
    priceMinor: "",
    stockQuantity: "",
  };

  if (laTaoMoi === false) {
    giaTriBanDau = {
      name: "",
      description: "",
      categoryId: "",
    };

    if (sanPham !== null) {
      giaTriBanDau.name = sanPham.name;

      if (sanPham.description !== null) {
        if (sanPham.description !== undefined) {
          giaTriBanDau.description = sanPham.description;
        }
      }

      if (sanPham.categoryId !== null) {
        if (sanPham.categoryId !== undefined) {
          giaTriBanDau.categoryId = String(sanPham.categoryId);
        }
      }
    }
  }

  const bieuMau = useForm({
    resolver: zodResolver(boKiemTra),
    defaultValues: giaTriBanDau,
  });

  const cacLoi = bieuMau.formState.errors;

  // Danh mục tải bất đồng bộ nên cần gán lại giá trị sau khi có danh sách.
  useEffect(
    function () {
      if (laTaoMoi === true) {
        return;
      }

      if (dangTaiDanhMuc === true) {
        return;
      }

      if (sanPham === null) {
        return;
      }

      if (sanPham.categoryId === null) {
        return;
      }

      if (sanPham.categoryId === undefined) {
        return;
      }

      bieuMau.setValue("categoryId", String(sanPham.categoryId));
    },
    [laTaoMoi, dangTaiDanhMuc, sanPham, bieuMau],
  );

  // Biến này cho biết danh mục hiện tại đã bị xoá khỏi cây danh mục hay chưa.
  let danhMucBiThieu = false;

  if (laTaoMoi === false) {
    if (sanPham !== null) {
      if (sanPham.categoryId !== null) {
        if (sanPham.categoryId !== undefined) {
          danhMucBiThieu = true;

          for (const danhMuc of danhSachDanhMuc) {
            if (String(danhMuc.id) === String(sanPham.categoryId)) {
              danhMucBiThieu = false;
            }
          }
        }
      }
    }
  }

  // Mảng này lưu các lựa chọn danh mục trong ô chọn.
  const cacLuaChonDanhMuc = [];

  for (const danhMuc of danhSachDanhMuc) {
    const khoangThut = taoKhoangThutDoSau(danhMuc.depth);

    // Biến này lưu tiền tố thể hiện cấp con của danh mục.
    let tienToCapCon = "";

    if (danhMuc.depth > 0) {
      tienToCapCon = "└ ";
    }

    cacLuaChonDanhMuc.push(
      <option value={danhMuc.id} key={danhMuc.id}>
        {khoangThut}
        {tienToCapCon}
        {danhMuc.name}
      </option>,
    );
  }

  // Phần tử này hiển thị lựa chọn cho danh mục đã bị xoá khỏi cây.
  if (danhMucBiThieu === true) {
    cacLuaChonDanhMuc.unshift(
      <option value={sanPham.categoryId} key="danh-muc-bi-thieu">
        {sanPham.categoryName} (không còn trong cây danh mục)
      </option>,
    );
  }

  // Phần tử này hiển thị lỗi chung do quá trình gửi biểu mẫu trả về.
  let phanTuLoiChung = null;

  if (typeof thuocTinh.error === "string") {
    if (thuocTinh.error !== "") {
      phanTuLoiChung = (
        <div className="alert alert--danger" role="alert">
          <TriangleAlert size={18} />
          <div>{thuocTinh.error}</div>
        </div>
      );
    }
  }

  // Biến này lưu nhãn của lựa chọn danh mục mặc định.
  let nhanChonDanhMuc = "— Chọn danh mục —";

  if (dangTaiDanhMuc === true) {
    nhanChonDanhMuc = "Đang tải danh mục…";
  }

  // Phần tử này hiển thị gợi ý SKU khi trường chưa có lỗi.
  let phanTuGoiYSku = null;

  if (cacLoi.sku === undefined) {
    phanTuGoiYSku = (
      <p className="field-hint">
        Không bắt buộc. Nếu nhập, SKU phải duy nhất trên toàn hệ thống.
      </p>
    );
  }

  // Phần tử này hiển thị phần biến thể đầu tiên khi tạo sản phẩm.
  let phanTuBienTheDauTien = null;

  if (laTaoMoi === true) {
    phanTuBienTheDauTien = (
      <section className="panel-card">
        <div className="panel-card__head">
          <div>
            <h2>Biến thể đầu tiên</h2>
            <p className="cell-sub">
              Sản phẩm cần ít nhất một biến thể để có giá bán.
            </p>
          </div>
        </div>
        <div className="panel-card__body">
          <div className="form-grid">
            <div className={layLopTruong(cacLoi.priceMinor !== undefined)}>
              <label className="required" htmlFor="product-price">
                Giá bán (₫)
              </label>
              <input
                className="input"
                id="product-price"
                type="number"
                min="0"
                step="1"
                placeholder="VD: 250000"
                disabled={dangKhoa}
                name="priceMinor"
                onChange={bieuMau.register("priceMinor").onChange}
                onBlur={bieuMau.register("priceMinor").onBlur}
                ref={bieuMau.register("priceMinor").ref}
              />
              <LoiTruong error={cacLoi.priceMinor} />
            </div>
            <div className={layLopTruong(cacLoi.stockQuantity !== undefined)}>
              <label className="required" htmlFor="product-stock">
                Tồn kho
              </label>
              <input
                className="input"
                id="product-stock"
                type="number"
                min="0"
                step="1"
                placeholder="VD: 20"
                disabled={dangKhoa}
                name="stockQuantity"
                onChange={bieuMau.register("stockQuantity").onChange}
                onBlur={bieuMau.register("stockQuantity").onBlur}
                ref={bieuMau.register("stockQuantity").ref}
              />
              <LoiTruong error={cacLoi.stockQuantity} />
            </div>
          </div>

          <div className={layLopTruong(cacLoi.sku !== undefined)}>
            <label htmlFor="product-sku">SKU</label>
            <input
              className="input"
              id="product-sku"
              maxLength={64}
              disabled={dangKhoa}
              placeholder="VD: AO-DEN-L"
              name="sku"
              onChange={bieuMau.register("sku").onChange}
              onBlur={bieuMau.register("sku").onBlur}
              ref={bieuMau.register("sku").ref}
            />
            <LoiTruong error={cacLoi.sku} />
            {phanTuGoiYSku}
          </div>

          <p className="field-hint">
            Sau khi tạo, bạn có thể thêm biến thể màu/size khác và tải ảnh ở
            trang chi tiết.
          </p>
        </div>
      </section>
    );
  }

  // Hàm này gửi dữ liệu biểu mẫu lên thành phần cha.
  function xuLyGuiBieuMau(giaTri) {
    thuocTinh.onSubmit(giaTri);
  }

  // Biến này cho biết nút gửi có đang chờ hay không.
  let dangGui = false;

  if (thuocTinh.isPending === true) {
    dangGui = true;
  }

  if (dangKhoa === true) {
    dangGui = true;
  }

  // Biến này lưu nhãn của nút gửi.
  let nhanNutGui = "Lưu thay đổi";

  if (laTaoMoi === true) {
    nhanNutGui = "Tạo sản phẩm";
  }

  // Phần tử này hiển thị biểu tượng trên nút gửi.
  let phanTuBieuTuongNut = <Save size={16} />;

  if (thuocTinh.isPending === true) {
    phanTuBieuTuongNut = <LoaderCircle className="spin" size={16} />;
  }

  // Phần tử này hiển thị gợi ý mô tả khi trường chưa có lỗi.
  let phanTuGoiYMoTa = null;

  if (cacLoi.description === undefined) {
    phanTuGoiYMoTa = (
      <p className="field-hint">Tối đa 5000 ký tự. Có thể để trống.</p>
    );
  }

  const dangKyTen = bieuMau.register("name");
  const dangKyDanhMuc = bieuMau.register("categoryId");
  const dangKyMoTa = bieuMau.register("description");

  return (
    <form
      className="admin-form"
      onSubmit={bieuMau.handleSubmit(xuLyGuiBieuMau)}
      noValidate
    >
      <section className="panel-card">
        <div className="panel-card__head">
          <h2>Thông tin sản phẩm</h2>
        </div>
        <div className="panel-card__body">
          <div className="admin-field-stack">
            <div className={layLopTruong(cacLoi.name !== undefined)}>
              <label className="required" htmlFor="product-name">
                Tên sản phẩm
              </label>
              <input
                className="input"
                id="product-name"
                placeholder="VD: Áo thun nam basic cotton"
                maxLength={200}
                disabled={dangKhoa}
                autoFocus={dangKhoa === false}
                name={dangKyTen.name}
                onChange={dangKyTen.onChange}
                onBlur={dangKyTen.onBlur}
                ref={dangKyTen.ref}
              />
              <LoiTruong error={cacLoi.name} />
            </div>

            <div className={layLopTruong(cacLoi.categoryId !== undefined)}>
              <label className="required" htmlFor="product-category">
                Danh mục
              </label>
              <select
                className="select"
                id="product-category"
                disabled={khoaChonDanhMuc}
                name={dangKyDanhMuc.name}
                onChange={dangKyDanhMuc.onChange}
                onBlur={dangKyDanhMuc.onBlur}
                ref={dangKyDanhMuc.ref}
              >
                <option value="">{nhanChonDanhMuc}</option>
                {cacLuaChonDanhMuc}
              </select>
              <LoiTruong error={cacLoi.categoryId} />
            </div>

            <div className={layLopTruong(cacLoi.description !== undefined)}>
              <label htmlFor="product-description">Mô tả</label>
              <textarea
                className="textarea"
                id="product-description"
                rows={5}
                maxLength={5000}
                disabled={dangKhoa}
                placeholder="Chất liệu, kích thước, hướng dẫn sử dụng…"
                name={dangKyMoTa.name}
                onChange={dangKyMoTa.onChange}
                onBlur={dangKyMoTa.onBlur}
                ref={dangKyMoTa.ref}
              />
              <LoiTruong error={cacLoi.description} />
              {phanTuGoiYMoTa}
            </div>

            {phanTuLoiChung}
          </div>
        </div>
      </section>

      {phanTuBienTheDauTien}

      <div className="admin-form-actions">
        <Link className="btn" to={duongDanCoSo}>
          Huỷ
        </Link>
        <button className="btn btn--primary" type="submit" disabled={dangGui}>
          {phanTuBieuTuongNut}
          {nhanNutGui}
        </button>
      </div>
    </form>
  );
}
