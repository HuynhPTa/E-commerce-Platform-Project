import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useCayDanhMuc } from "../hooks/useCategoryTree.js";
import { useSoLuongSanPhamTheoDanhMuc } from "../hooks/useCategoryProductCounts.js";
import { useTrangSanPham } from "../hooks/useProductPage.js";
import { themVaoGioHang } from "../api/cartApi.js";
import {
  SO_SAN_PHAM_MOI_TRANG,
  docBoLocDanhSachSanPham,
  taoThamSoTimKiemDaCapNhat,
} from "../lib/productListSearch.js";
import BoLocDanhMuc from "../components/catalog/CategoryFilter.jsx";
import BoLocGia from "../components/catalog/PriceFilter.jsx";
import ThanhCongCuDanhSach from "../components/catalog/CatalogToolbar.jsx";
import PhanTrang from "../components/catalog/Pagination.jsx";
import TheSanPham from "../components/product/ProductCard.jsx";

// Hàm này kiểm tra trình duyệt có token đăng nhập còn dùng được hay không.
function kiemTraDaDangNhap() {
  const accessToken = localStorage.getItem("access_token");

  if (accessToken === undefined) {
    return false;
  }

  if (accessToken === null) {
    return false;
  }

  if (accessToken === "undefined") {
    return false;
  }

  if (accessToken === "") {
    return false;
  }

  return true;
}

// Thành phần này hiển thị trang danh sách sản phẩm với bộ lọc, sắp xếp và phân trang.
export default function TrangDanhSachSanPham() {
  // useSearchParams trả về mảng gồm tham số tìm kiếm và hàm cập nhật tham số.
  const capThamSoTimKiem = useSearchParams();

  // Biến này lưu bộ tham số tìm kiếm hiện tại trên đường dẫn.
  const thamSoTimKiem = capThamSoTimKiem[0];

  // Biến này lưu hàm dùng để cập nhật bộ tham số trên đường dẫn.
  const capNhatThamSoTimKiem = capThamSoTimKiem[1];

  // Biến này lưu bộ lọc sản phẩm đã được đọc từ đường dẫn.
  const boLocSanPham = docBoLocDanhSachSanPham(thamSoTimKiem);

  // Hook này gọi API lấy cây danh mục.
  const ketQuaCayDanhMuc = useCayDanhMuc();

  // Biến này lưu cây danh mục sau khi kiểm tra dữ liệu trả về.
  let cayDanhMuc = [];
  const duLieuCayDanhMuc = ketQuaCayDanhMuc.data;

  // Nếu dữ liệu trả về là một mảng thì mới dùng được.
  if (duLieuCayDanhMuc !== undefined) {
    if (Array.isArray(duLieuCayDanhMuc) === true) {
      cayDanhMuc = duLieuCayDanhMuc;
    }
  }

  // Hook này lấy số lượng sản phẩm của từng danh mục.
  const soLuongTheoSlug = useSoLuongSanPhamTheoDanhMuc(cayDanhMuc);

  // Hook này gọi API lấy trang sản phẩm theo bộ lọc hiện tại.
  const ketQuaTrangSanPham = useTrangSanPham(boLocSanPham);

  // useQueryClient trả về bộ quản lý truy vấn để làm mới dữ liệu sau khi thêm giỏ.
  const boQuanLyTruyVan = useQueryClient();

  // useMutation tạo thao tác thêm sản phẩm vào giỏ hàng.
  const thaoTacThemVaoGio = useMutation({ mutationFn: themVaoGioHang });

  // useState tạo nội dung thông báo hiển thị ở góc trang.
  const trangThaiThongBao = useState("");

  // Biến này lưu nội dung thông báo hiện tại.
  const thongBao = trangThaiThongBao[0];

  // Biến này lưu hàm cập nhật nội dung thông báo.
  const capNhatThongBao = trangThaiThongBao[1];

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

  // Hàm này cập nhật bộ lọc bằng cách tạo bộ tham số mới trên đường dẫn.
  function xuLyCapNhatBoLoc(cacThayDoi) {
    const thamSoMoi = taoThamSoTimKiemDaCapNhat(thamSoTimKiem, cacThayDoi);
    capNhatThamSoTimKiem(thamSoMoi);
  }

  // Hàm này xử lý khi người dùng chọn danh mục.
  function xuLyDoiDanhMuc(slugDanhMuc) {
    const cacThayDoi = {
      category: slugDanhMuc,
      page: 1,
    };

    xuLyCapNhatBoLoc(cacThayDoi);
  }

  // Hàm này xử lý khi người dùng áp dụng khoảng giá.
  function xuLyApDungGia(duLieuGia) {
    const cacThayDoi = {
      minPrice: duLieuGia.giaThapNhat,
      maxPrice: duLieuGia.giaCaoNhat,
      page: 1,
    };

    xuLyCapNhatBoLoc(cacThayDoi);
  }

  // Hàm này xử lý khi người dùng đổi cách sắp xếp.
  function xuLyDoiSapXep(giaTriSapXep) {
    const cacThayDoi = {
      sort: giaTriSapXep,
      page: 1,
    };

    xuLyCapNhatBoLoc(cacThayDoi);
  }

  // Hàm này xử lý khi người dùng chuyển trang.
  function xuLyDoiTrang(soTrang) {
    const cacThayDoi = { page: soTrang };

    xuLyCapNhatBoLoc(cacThayDoi);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Hàm này xoá toàn bộ bộ lọc và đưa đường dẫn về trạng thái ban đầu.
  function xuLyXoaBoLoc() {
    capNhatThamSoTimKiem(new URLSearchParams());
  }

  // Hàm này thêm nhanh một sản phẩm vào giỏ hàng.
  function xuLyThemNhanh(sanPham) {
    // Nếu người dùng chưa đăng nhập thì yêu cầu đăng nhập.
    if (kiemTraDaDangNhap() === false) {
      hienThiThongBao("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    // Biến này lưu danh sách phiên bản của sản phẩm.
    let danhSachPhienBan = [];

    // Nếu sản phẩm có danh sách phiên bản thì mới dùng được.
    if (Array.isArray(sanPham.variants) === true) {
      danhSachPhienBan = sanPham.variants;
    }

    // Biến này lưu phiên bản đầu tiên còn hàng.
    let phienBanConHang = null;

    // Tìm phiên bản đầu tiên có tồn kho lớn hơn 0.
    for (const phienBan of danhSachPhienBan) {
      if (phienBan.stockQuantity > 0) {
        phienBanConHang = phienBan;
        break;
      }
    }

    // Nếu không có phiên bản nào còn hàng thì báo hết hàng.
    if (phienBanConHang === null) {
      hienThiThongBao("Sản phẩm này đã hết hàng.");
      return;
    }

    // Biến này lưu dữ liệu gửi lên API thêm vào giỏ.
    const duLieuGui = {
      variantId: phienBanConHang.id,
      quantity: 1,
    };

    // Hàm này xử lý khi thêm vào giỏ thành công.
    function xuLyThemThanhCong() {
      boQuanLyTruyVan.invalidateQueries({ queryKey: ["cart"] });
      hienThiThongBao('Đã thêm "' + sanPham.name + '" vào giỏ hàng.');
    }

    // Hàm này xử lý khi thêm vào giỏ thất bại.
    function xuLyThemThatBai() {
      hienThiThongBao("Không thêm được vào giỏ hàng. Vui lòng thử lại.");
    }

    const tuyChonThaoTac = {
      onSuccess: xuLyThemThanhCong,
      onError: xuLyThemThatBai,
    };

    thaoTacThemVaoGio.mutate(duLieuGui, tuyChonThaoTac);
  }

  // Hàm này gọi lại API khi người dùng bấm nút thử lại.
  function xuLyThuLai() {
    ketQuaTrangSanPham.refetch();
  }

  // Biến này lưu dữ liệu trang sản phẩm trả về từ backend.
  const duLieuTrang = ketQuaTrangSanPham.data;

  // Biến này lưu danh sách sản phẩm của trang hiện tại.
  let danhSachSanPham = [];

  // Biến này lưu tổng số sản phẩm khớp bộ lọc.
  let tongSoSanPham = 0;

  // Biến này lưu tổng số trang sản phẩm.
  let tongSoTrang = 0;

  // Biến này lưu số trang hiện tại, mặc định lấy từ bộ lọc trên đường dẫn.
  let trangHienTai = boLocSanPham.page;

  // Đọc dữ liệu trang nếu backend đã trả về.
  if (duLieuTrang !== undefined) {
    if (duLieuTrang !== null) {
      if (Array.isArray(duLieuTrang.items) === true) {
        danhSachSanPham = duLieuTrang.items;
      }

      if (duLieuTrang.totalItems !== undefined) {
        if (duLieuTrang.totalItems !== null) {
          tongSoSanPham = duLieuTrang.totalItems;
        }
      }

      if (duLieuTrang.totalPages !== undefined) {
        if (duLieuTrang.totalPages !== null) {
          tongSoTrang = duLieuTrang.totalPages;
        }
      }

      if (duLieuTrang.page !== undefined) {
        if (duLieuTrang.page !== null) {
          trangHienTai = duLieuTrang.page;
        }
      }
    }
  }

  // Biến này cho biết dữ liệu đang được tải lần đầu hay không.
  const dangTai = ketQuaTrangSanPham.isLoading;

  // Biến này cho biết lần tải dữ liệu có bị lỗi hay không.
  const coLoi = ketQuaTrangSanPham.isError;

  // Biến này cho biết dữ liệu đang được tải lại hay không.
  const dangTaiLai = ketQuaTrangSanPham.isFetching;

  // Biến này lưu vị trí sản phẩm đầu tiên trên trang.
  let viTriDauTien = 0;

  // Nếu trang có sản phẩm thì tính vị trí đầu tiên.
  if (danhSachSanPham.length > 0) {
    viTriDauTien = (trangHienTai - 1) * SO_SAN_PHAM_MOI_TRANG + 1;
  }

  // Biến này lưu vị trí sản phẩm cuối cùng trên trang.
  let viTriCuoiCung = trangHienTai * SO_SAN_PHAM_MOI_TRANG;

  // Không cho vị trí cuối vượt quá tổng số sản phẩm.
  if (viTriCuoiCung > tongSoSanPham) {
    viTriCuoiCung = tongSoSanPham;
  }

  // Hàm này kiểm tra một danh mục có phải danh mục đang chọn hay không.
  function kiemTraDanhMucDangChon(danhMuc) {
    return danhMuc.slug === boLocSanPham.category;
  }

  // Biến này lưu danh mục đang được chọn.
  const danhMucDangChon = cayDanhMuc.find(kiemTraDanhMucDangChon);

  // Biến này lưu tiêu đề trang.
  let tieuDeTrang = "Tất cả sản phẩm";

  // Nếu đang tìm theo từ khoá thì hiển thị tiêu đề tìm kiếm.
  if (boLocSanPham.q !== undefined) {
    tieuDeTrang = "Kết quả cho “" + boLocSanPham.q + "”";
  } else if (danhMucDangChon !== undefined) {
    // Nếu đang lọc theo danh mục thì dùng tên danh mục làm tiêu đề.
    tieuDeTrang = danhMucDangChon.name;
  }

  // Biến này lưu nội dung bên phải phần tiêu đề trang.
  let noiDungTrangHienTai = "Chưa có sản phẩm";

  // Nếu có trang thì hiển thị trang hiện tại trên tổng số trang.
  if (tongSoTrang > 0) {
    noiDungTrangHienTai = "Trang " + trangHienTai + " / " + tongSoTrang;
  }

  // Biến này lưu phần giá thấp nhất để tạo khoá cho bộ lọc giá.
  let phanGiaThapNhat = "";

  if (boLocSanPham.minPrice !== undefined) {
    phanGiaThapNhat = String(boLocSanPham.minPrice);
  }

  // Biến này lưu phần giá cao nhất để tạo khoá cho bộ lọc giá.
  let phanGiaCaoNhat = "";

  if (boLocSanPham.maxPrice !== undefined) {
    phanGiaCaoNhat = String(boLocSanPham.maxPrice);
  }

  // Khoá này giúp bộ lọc giá được tạo lại khi khoảng giá trên đường dẫn thay đổi.
  const khoaBoLocGia = phanGiaThapNhat + "-" + phanGiaCaoNhat;

  // Phần tử này hiển thị danh sách sản phẩm hoặc trạng thái tương ứng.
  let phanTuDanhSachSanPham;

  // Nếu đang tải lần đầu thì hiển thị trạng thái đang tải.
  if (dangTai === true) {
    phanTuDanhSachSanPham = (
      <div className="catalog-state" role="status">
        <h2>Đang tải sản phẩm…</h2>
        <p>Dữ liệu đang được lấy từ MarketHub.</p>
      </div>
    );
  } else if (coLoi === true) {
    // Nếu tải lỗi thì hiển thị thông báo và nút thử lại.
    phanTuDanhSachSanPham = (
      <div className="catalog-state" role="alert">
        <h2>Không tải được sản phẩm</h2>
        <p>Kiểm tra backend và MySQL đang chạy, sau đó thử lại.</p>
        <button className="btn" type="button" onClick={xuLyThuLai}>
          Thử lại
        </button>
      </div>
    );
  } else if (danhSachSanPham.length === 0) {
    // Nếu không có sản phẩm nào thì hiển thị trạng thái rỗng.
    phanTuDanhSachSanPham = (
      <div className="catalog-state">
        <h2>Không tìm thấy sản phẩm</h2>
        <p>Thử bỏ bớt bộ lọc hoặc tìm với từ khoá khác.</p>
        <button className="btn" type="button" onClick={xuLyXoaBoLoc}>
          Xoá bộ lọc
        </button>
      </div>
    );
  } else {
    // Nếu có sản phẩm thì tạo lưới sản phẩm và thanh phân trang.
    let tenLopLuoiSanPham = "product-grid product-grid--3";

    // Thêm lớp hiệu ứng khi dữ liệu đang được tải lại.
    if (dangTaiLai === true) {
      tenLopLuoiSanPham += " catalog-grid--updating";
    }

    // Mảng này lưu các thẻ sản phẩm.
    const cacTheSanPham = [];

    // Tạo thẻ cho từng sản phẩm trong trang.
    for (const sanPhamCuaTrang of danhSachSanPham) {
      cacTheSanPham.push(
        <TheSanPham
          key={sanPhamCuaTrang.id}
          sanPham={sanPhamCuaTrang}
          khiThemNhanh={xuLyThemNhanh}
        />,
      );
    }

    phanTuDanhSachSanPham = (
      <>
        <div className={tenLopLuoiSanPham}>{cacTheSanPham}</div>

        <PhanTrang
          trangHienTai={trangHienTai}
          tongSoTrang={tongSoTrang}
          khiDoiTrang={xuLyDoiTrang}
        />
      </>
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
          <h1>{tieuDeTrang}</h1>
        </div>
        <div className="page-head__aside">{noiDungTrangHienTai}</div>
      </div>

      <div className="catalog-layout">
        <aside className="filters" aria-label="Bộ lọc sản phẩm">
          <div className="filter-panel">
            <BoLocDanhMuc
              danhSachDanhMuc={cayDanhMuc}
              slugDanhMucDangChon={boLocSanPham.category}
              soLuongTheoSlug={soLuongTheoSlug}
              tongSoSanPham={tongSoSanPham}
              khiChonDanhMuc={xuLyDoiDanhMuc}
            />

            <BoLocGia
              key={khoaBoLocGia}
              giaThapNhat={boLocSanPham.minPrice}
              giaCaoNhat={boLocSanPham.maxPrice}
              khiApDung={xuLyApDungGia}
            />
          </div>
        </aside>

        <div>
          <ThanhCongCuDanhSach
            viTriDauTien={viTriDauTien}
            viTriCuoiCung={viTriCuoiCung}
            tongSoSanPham={tongSoSanPham}
            sapXep={boLocSanPham.sort}
            khiDoiSapXep={xuLyDoiSapXep}
          />

          {phanTuDanhSachSanPham}
        </div>
      </div>

      <div
        className={tenLopThongBao}
        role="status"
        aria-live="polite"
      >
        {thongBao}
      </div>
    </div>
  );
}
