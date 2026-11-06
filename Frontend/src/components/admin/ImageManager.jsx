import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  LoaderCircle,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import HopThoaiQuanTri from "./AdminModal";
import { layThongBaoLoi } from "../../lib/adminHelpers";
import { taoDuongDanTaiNguyen } from "../../lib/assetUrl";
import {
  useTaiAnhSanPhamQuanTri,
  useXoaAnhSanPhamQuanTri,
} from "../../hooks/useAdminProducts";

// Các hằng số này quy định giới hạn ảnh của một sản phẩm.
const SO_ANH_TOI_DA = 10;
const KICH_THUOC_TOI_DA = 5 * 1024 * 1024;
const CAC_DINH_DANG_CHO_PHEP = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const CHUOI_DINH_DANG_CHO_PHEP = CAC_DINH_DANG_CHO_PHEP.join(",");

// Biến này giúp tạo mã tạm duy nhất cho các ảnh đang chờ tải lên.
let soThuTuAnhCho = 0;

// Hàm này kiểm tra một định dạng tệp có được chấp nhận hay không.
function laDinhDangAnhHopLe(dinhDang) {
  for (const dinhDangChoPhep of CAC_DINH_DANG_CHO_PHEP) {
    if (dinhDang === dinhDangChoPhep) {
      return true;
    }
  }

  return false;
}

// Thành phần này hiển thị hộp thoại xác nhận xoá ảnh.
function HopThoaiXoaAnh(thuocTinh) {
  const xoaAnh = useXoaAnhSanPhamQuanTri();
  const sanPham = thuocTinh.product;
  const anhCanXoa = thuocTinh.image;

  // Biến này lưu đường dẫn đầy đủ của ảnh cần xoá.
  const duongDanAnh = taoDuongDanTaiNguyen(anhCanXoa.url);

  // Hàm này xoá ảnh khỏi sản phẩm.
  function xuLyXoaAnh() {
    const duLieuXoa = {
      productId: sanPham.id,
      imageId: anhCanXoa.id,
    };

    xoaAnh.mutate(duLieuXoa, {
      onSuccess: thuocTinh.onClose,
    });
  }

  // Phần tử này hiển thị lỗi nếu không xoá được ảnh.
  let phanTuLoi = null;

  if (xoaAnh.isError === true) {
    phanTuLoi = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{layThongBaoLoi(xoaAnh.error)}</div>
      </div>
    );
  }

  // Phần tử này hiển thị biểu tượng trên nút xoá.
  let phanTuBieuTuongXoa = <Trash2 size={16} />;

  if (xoaAnh.isPending === true) {
    phanTuBieuTuongXoa = <LoaderCircle className="spin" size={16} />;
  }

  return (
    <HopThoaiQuanTri
      title="Xoá ảnh sản phẩm"
      onClose={thuocTinh.onClose}
      width={440}
      footer={
        <>
          <button className="btn" type="button" onClick={thuocTinh.onClose}>
            Huỷ
          </button>
          <button
            className="btn btn--danger"
            type="button"
            disabled={xoaAnh.isPending === true}
            onClick={xuLyXoaAnh}
          >
            {phanTuBieuTuongXoa}
            Xoá
          </button>
        </>
      }
    >
      <p>
        Xoá ảnh này khỏi sản phẩm? File trên máy chủ cũng bị xoá và không
        thể khôi phục.
      </p>
      <div className="image-delete-preview">
        <img src={duongDanAnh} alt="" />
      </div>
      {phanTuLoi}
    </HopThoaiQuanTri>
  );
}

// Thành phần này hiển thị khu vực quản lý ảnh của một sản phẩm.
export default function QuanLyAnhQuanTri(thuocTinh) {
  const sanPham = thuocTinh.product;

  // Biến này cho biết khu vực ảnh có bị khoá thao tác hay không.
  let dangKhoa = false;

  if (thuocTinh.disabled === true) {
    dangKhoa = true;
  }

  const taiAnh = useTaiAnhSanPhamQuanTri();

  // Trạng thái này lưu các ảnh đang chờ hoặc đang tải lên.
  const trangThaiAnhCho = useState([]);

  // Biến này lưu danh sách ảnh đang chờ tải lên.
  const anhDangCho = trangThaiAnhCho[0];

  // Biến này lưu hàm cập nhật danh sách ảnh đang chờ.
  const capNhatAnhDangCho = trangThaiAnhCho[1];

  // Trạng thái này lưu thông báo lỗi khi chọn tệp.
  const trangThaiThongBao = useState("");

  // Biến này lưu thông báo hiện tại.
  const thongBao = trangThaiThongBao[0];

  // Biến này lưu hàm cập nhật thông báo.
  const capNhatThongBao = trangThaiThongBao[1];

  // Trạng thái này lưu ảnh đang được xác nhận xoá.
  const trangThaiAnhCanXoa = useState(null);

  // Biến này lưu ảnh đang được xác nhận xoá.
  const anhCanXoa = trangThaiAnhCanXoa[0];

  // Biến này lưu hàm cập nhật ảnh cần xoá.
  const capNhatAnhCanXoa = trangThaiAnhCanXoa[1];

  // Tham chiếu này trỏ tới ô chọn tệp ảnh.
  const oChonTep = useRef(null);

  // Tham chiếu này luôn trỏ tới danh sách ảnh đang chờ mới nhất.
  const anhDangChoMoiNhat = useRef(anhDangCho);

  useEffect(
    function () {
      anhDangChoMoiNhat.current = anhDangCho;
    },
    [anhDangCho],
  );

  // Giải phóng các đường dẫn xem trước khi rời trang.
  useEffect(
    function () {
      return function () {
        for (const anhCho of anhDangChoMoiNhat.current) {
          URL.revokeObjectURL(anhCho.previewUrl);
        }
      };
    },
    [],
  );

  // Biến này lưu danh sách ảnh đã có trên sản phẩm.
  let danhSachAnh = [];

  if (Array.isArray(sanPham.images) === true) {
    danhSachAnh = sanPham.images;
  }

  // Biến này cho biết vẫn còn ảnh đang chờ hoặc đang tải lên.
  let dangTaiAnh = false;

  for (const anhCho of anhDangCho) {
    if (anhCho.status === "waiting") {
      dangTaiAnh = true;
    }

    if (anhCho.status === "uploading") {
      dangTaiAnh = true;
    }
  }

  // Biến này cho biết đã đạt giới hạn số ảnh hay chưa.
  let daDatGioiHan = false;

  if (danhSachAnh.length + anhDangCho.length >= SO_ANH_TOI_DA) {
    daDatGioiHan = true;
  }

  // Hàm này xoá một ảnh đang chờ khỏi danh sách.
  function xuLyBoAnhCho(maAnhCho) {
    capNhatAnhDangCho(function (danhSachTruoc) {
      const danhSachMoi = [];

      for (const anhCho of danhSachTruoc) {
        if (anhCho.id === maAnhCho) {
          URL.revokeObjectURL(anhCho.previewUrl);
        } else {
          danhSachMoi.push(anhCho);
        }
      }

      return danhSachMoi;
    });
  }

  // Hàm này cập nhật trạng thái của một ảnh đang chờ.
  async function xuLyChonTep(suKienChon) {
    const cacTepDuocChon = [];

    for (const tepCuaNguoiDung of suKienChon.target.files) {
      cacTepDuocChon.push(tepCuaNguoiDung);
    }

    if (oChonTep.current !== null) {
      oChonTep.current.value = "";
    }

    if (cacTepDuocChon.length === 0) {
      return;
    }

    capNhatThongBao("");

    // Biến này lưu số vị trí ảnh còn trống.
    let soViTriConTrong =
      SO_ANH_TOI_DA - danhSachAnh.length - anhDangCho.length;

    if (soViTriConTrong < 0) {
      soViTriConTrong = 0;
    }

    const cacTepHopLe = [];
    const cacVanDe = [];

    for (const tepCuaNguoiDung of cacTepDuocChon) {
      if (laDinhDangAnhHopLe(tepCuaNguoiDung.type) === false) {
        cacVanDe.push(
          tepCuaNguoiDung.name + ": chỉ nhận JPEG/PNG/WEBP/GIF.",
        );
        continue;
      }

      if (tepCuaNguoiDung.size > KICH_THUOC_TOI_DA) {
        cacVanDe.push(tepCuaNguoiDung.name + ": vượt quá 5 MB.");
        continue;
      }

      if (cacTepHopLe.length >= soViTriConTrong) {
        cacVanDe.push(
          "Chỉ còn " +
            soViTriConTrong +
            " vị trí ảnh (tối đa " +
            SO_ANH_TOI_DA +
            " ảnh/sản phẩm).",
        );
        break;
      }

      cacTepHopLe.push(tepCuaNguoiDung);
    }

    if (cacVanDe.length > 0) {
      capNhatThongBao(cacVanDe.join(" "));
    }

    if (cacTepHopLe.length === 0) {
      return;
    }

    // Mảng này lưu các mục ảnh mới cần tải lên.
    const cacMucAnhMoi = [];

    for (const tepHopLe of cacTepHopLe) {
      soThuTuAnhCho = soThuTuAnhCho + 1;

      const mucAnh = {
        id: "pending-" + Date.now() + "-" + soThuTuAnhCho,
        file: tepHopLe,
        previewUrl: URL.createObjectURL(tepHopLe),
        status: "waiting",
        error: "",
      };

      cacMucAnhMoi.push(mucAnh);
    }

    capNhatAnhDangCho(function (danhSachTruoc) {
      const danhSachMoi = [];

      for (const anhCho of danhSachTruoc) {
        danhSachMoi.push(anhCho);
      }

      for (const mucAnh of cacMucAnhMoi) {
        danhSachMoi.push(mucAnh);
      }

      return danhSachMoi;
    });

    // Tải ảnh lần lượt để tránh làm quá tải máy chủ.
    for (const mucAnh of cacMucAnhMoi) {
      capNhatAnhDangCho(function (danhSachTruoc) {
        const danhSachMoi = [];

        for (const anhCho of danhSachTruoc) {
          if (anhCho.id === mucAnh.id) {
            const anhDaCapNhat = {
              id: anhCho.id,
              file: anhCho.file,
              previewUrl: anhCho.previewUrl,
              status: "uploading",
              error: anhCho.error,
            };
            danhSachMoi.push(anhDaCapNhat);
          } else {
            danhSachMoi.push(anhCho);
          }
        }

        return danhSachMoi;
      });

      try {
        const duLieuTaiAnh = {
          productId: sanPham.id,
          file: mucAnh.file,
        };

        await taiAnh.mutateAsync(duLieuTaiAnh);
        URL.revokeObjectURL(mucAnh.previewUrl);
        xuLyBoAnhCho(mucAnh.id);
      } catch (loi) {
        const thongDiepLoi = layThongBaoLoi(loi);

        capNhatAnhDangCho(function (danhSachTruoc) {
          const danhSachMoi = [];

          for (const anhCho of danhSachTruoc) {
            if (anhCho.id === mucAnh.id) {
              const anhDaCapNhat = {
                id: anhCho.id,
                file: anhCho.file,
                previewUrl: anhCho.previewUrl,
                status: "error",
                error: thongDiepLoi,
              };
              danhSachMoi.push(anhDaCapNhat);
            } else {
              danhSachMoi.push(anhCho);
            }
          }

          return danhSachMoi;
        });
      }
    }
  }

  // Mảng này lưu giao diện của các ảnh đã có.
  const cacOAnhDaCo = [];

  for (const anhSanPham of danhSachAnh) {
    const duongDanAnh = taoDuongDanTaiNguyen(anhSanPham.url);

    // Phần tử này hiển thị nhãn ảnh bìa nếu ảnh đang là ảnh đại diện.
    let nhanAnhBia = null;

    if (anhSanPham.url === sanPham.thumbnailUrl) {
      nhanAnhBia = <span className="image-badge">Ảnh bìa</span>;
    }

    // Hàm này mở hộp thoại xoá ảnh hiện tại.
    function xuLyMoXoaAnh() {
      capNhatAnhCanXoa(anhSanPham);
    }

    cacOAnhDaCo.push(
      <figure className="image-tile" key={anhSanPham.id}>
        <img src={duongDanAnh} alt="" />
        {nhanAnhBia}
        <button
          className="image-remove"
          type="button"
          title="Xoá ảnh"
          disabled={dangKhoa}
          onClick={xuLyMoXoaAnh}
        >
          <X size={14} />
        </button>
      </figure>,
    );
  }

  // Mảng này lưu giao diện của các ảnh đang chờ tải lên.
  const cacOAnhDangCho = [];

  for (const anhCho of anhDangCho) {
    // Biến này cho biết ảnh đang chờ gặp lỗi.
    let coLoi = false;

    if (anhCho.status === "error") {
      coLoi = true;
    }

    // Biến này lưu lớp CSS của ô ảnh đang chờ.
    let lopOAnh = "image-tile is-pending";

    if (coLoi === true) {
      lopOAnh = "image-tile is-pending has-error";
    }

    // Phần tử này hiển thị trạng thái tải lên hoặc lỗi.
    let phanTuTrangThai = (
      <>
        <LoaderCircle className="spin" size={14} />
        Đang tải lên…
      </>
    );

    if (coLoi === true) {
      phanTuTrangThai = (
        <>
          <TriangleAlert size={14} />
          {anhCho.error}
        </>
      );
    }

    // Phần tử này hiển thị nút bỏ ảnh bị lỗi.
    let phanTuNutBo = null;

    if (coLoi === true) {
      phanTuNutBo = (
        <button
          className="image-remove"
          type="button"
          title="Bỏ ảnh lỗi"
          onClick={function () {
            xuLyBoAnhCho(anhCho.id);
          }}
        >
          <X size={14} />
        </button>
      );
    }

    cacOAnhDangCho.push(
      <figure className={lopOAnh} key={anhCho.id}>
        <img src={anhCho.previewUrl} alt="" />
        <figcaption className="image-status" title={anhCho.error}>
          {phanTuTrangThai}
        </figcaption>
        {phanTuNutBo}
      </figure>,
    );
  }

  // Phần tử này hiển thị thông báo khi chọn tệp không hợp lệ.
  let phanTuThongBao = null;

  if (thongBao !== "") {
    phanTuThongBao = (
      <div className="alert alert--danger" role="alert">
        <TriangleAlert size={18} />
        <div>{thongBao}</div>
      </div>
    );
  }

  // Phần tử này hiển thị trạng thái chưa có ảnh.
  let phanTuChuaCoAnh = null;

  if (danhSachAnh.length === 0) {
    if (anhDangCho.length === 0) {
      phanTuChuaCoAnh = (
        <p className="muted">
          Chưa có ảnh nào. Thêm ảnh để người mua xem sản phẩm rõ hơn.
        </p>
      );
    }
  }

  // Phần tử này hiển thị vùng chọn ảnh khi còn chỗ và không bị khoá.
  let phanTuVungTaiAnh = null;

  if (dangKhoa === false) {
    if (daDatGioiHan === false) {
      // Biến này lưu lớp CSS của vùng chọn ảnh.
      let lopVungTaiAnh = "image-upload-zone";

      if (dangTaiAnh === true) {
        lopVungTaiAnh = "image-upload-zone disabled";
      }

      phanTuVungTaiAnh = (
        <label className={lopVungTaiAnh}>
          <ImagePlus size={22} />
          <span>
            <strong>Chọn ảnh để tải lên</strong>
            <span className="cell-sub">
              Có thể chọn nhiều file · JPEG/PNG/WEBP/GIF · tối đa 5 MB/ảnh
            </span>
          </span>
          <input
            ref={oChonTep}
            type="file"
            accept={CHUOI_DINH_DANG_CHO_PHEP}
            multiple
            hidden
            disabled={dangTaiAnh}
            onChange={xuLyChonTep}
          />
        </label>
      );
    } else {
      phanTuVungTaiAnh = (
        <p className="field-hint">
          Đã đạt giới hạn {SO_ANH_TOI_DA} ảnh. Xoá bớt ảnh nếu muốn thêm.
        </p>
      );
    }
  }

  // Phần tử này hiển thị hộp thoại xoá ảnh.
  let phanTuHopThoaiXoa = null;

  if (anhCanXoa !== null) {
    phanTuHopThoaiXoa = (
      <HopThoaiXoaAnh
        product={sanPham}
        image={anhCanXoa}
        onClose={function () {
          capNhatAnhCanXoa(null);
        }}
      />
    );
  }

  return (
    <section className="panel-card">
      <div className="panel-card__head">
        <div>
          <h2>Ảnh sản phẩm</h2>
          <p className="cell-sub">
            {danhSachAnh.length}/{SO_ANH_TOI_DA} ảnh · ảnh đầu tiên tự động
            làm ảnh bìa nếu chưa có
          </p>
        </div>
      </div>

      <div className="panel-card__body">
        {phanTuThongBao}
        {phanTuChuaCoAnh}

        <div className="image-grid">
          {cacOAnhDaCo}
          {cacOAnhDangCho}
        </div>

        {phanTuVungTaiAnh}
      </div>

      {phanTuHopThoaiXoa}
    </section>
  );
}
