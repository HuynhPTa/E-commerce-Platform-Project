import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { themVaoGioHang } from "../api/cartApi.js";
import TheSanPham from "../components/product/ProductCard.jsx";
import ThuVienAnhSanPham from "../components/product/ProductGallery.jsx";
import DanhGiaSanPham from "../components/product/ProductReviews.jsx";
import HienThiSaoDanhGia from "../components/product/RatingStars.jsx";
import ChonPhienBan from "../components/product/VariantSelector.jsx";
import { useCayDanhMuc } from "../hooks/useCategoryTree.js";
import { useChiTietSanPham } from "../hooks/useProductDetail.js";
import { useDanhGiaSanPham } from "../hooks/useProductReviews.js";
import { useSanPhamLienQuan } from "../hooks/useRelatedProducts.js";
import { timDuongDanDanhMuc } from "../lib/categoryTree.js";
import { dinhDangTien } from "../lib/formatMoney.js";
import { taoThamSoTimKiemDaCapNhat } from "../lib/productListSearch.js";
import TrangKhongTimThay from "./NotFoundPage.jsx";

// Tiêu đề mặc định của tài liệu khi rời trang chi tiết sản phẩm.
const TIEU_DE_MAC_DINH = "Tất cả sản phẩm | MarketHub";

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

// Hàm này cuộn cửa sổ về đầu trang khi mở trang chi tiết.
function cuonLenDauTrang() {
  window.scrollTo({ top: 0 });
}

// Thành phần này hiển thị toàn bộ nội dung chi tiết của một sản phẩm.
function NoiDungChiTietSanPham(thuocTinh) {
  // Biến này lưu mã sản phẩm do thành phần cha truyền xuống.
  const maSanPham = thuocTinh.maSanPham;

  // useNavigate trả về hàm dùng để chuyển trang bằng mã lệnh.
  const hamDieuHuong = useNavigate();

  // useSearchParams trả về mảng gồm tham số trên đường dẫn và hàm cập nhật tham số.
  const capThamSoTimKiem = useSearchParams();

  // Biến này lưu bộ tham số hiện tại trên đường dẫn.
  const thamSoTimKiem = capThamSoTimKiem[0];

  // Biến này lưu hàm dùng để cập nhật bộ tham số trên đường dẫn.
  const capNhatThamSoTimKiem = capThamSoTimKiem[1];

  // useQueryClient trả về bộ quản lý truy vấn để làm mới dữ liệu giỏ hàng.
  const boQuanLyTruyVan = useQueryClient();

  // Hook này gọi API lấy cây danh mục.
  const ketQuaCayDanhMuc = useCayDanhMuc();

  // Hook này gọi API lấy chi tiết sản phẩm.
  const ketQuaSanPham = useChiTietSanPham(maSanPham);

  // Hook này gọi API lấy đánh giá của sản phẩm.
  const ketQuaDanhGia = useDanhGiaSanPham(maSanPham);

  // Biến này lưu cây danh mục sau khi kiểm tra dữ liệu trả về.
  let cayDanhMuc = [];
  const duLieuCayDanhMuc = ketQuaCayDanhMuc.data;

  // Nếu dữ liệu trả về là một mảng thì mới dùng được.
  if (duLieuCayDanhMuc !== undefined) {
    if (Array.isArray(duLieuCayDanhMuc) === true) {
      cayDanhMuc = duLieuCayDanhMuc;
    }
  }

  // Biến này lưu dữ liệu sản phẩm, mặc định là null khi chưa tải xong.
  let sanPham = null;
  const duLieuSanPham = ketQuaSanPham.data;

  // Nếu backend đã trả về sản phẩm thì dùng dữ liệu đó.
  if (duLieuSanPham !== undefined) {
    if (duLieuSanPham !== null) {
      sanPham = duLieuSanPham;
    }
  }

  // Biến này lưu mã danh mục của sản phẩm.
  let maDanhMucSanPham = undefined;

  if (sanPham !== null) {
    if (sanPham.categoryId !== undefined) {
      maDanhMucSanPham = sanPham.categoryId;
    }
  }

  // Biến này lưu đường dẫn danh mục từ gốc tới danh mục của sản phẩm.
  const duongDanDanhMuc = timDuongDanDanhMuc(
    cayDanhMuc,
    maDanhMucSanPham,
  );

  // Biến này lưu danh mục gốc của sản phẩm.
  let danhMucGoc = null;

  // Biến này lưu danh mục lá của sản phẩm.
  let danhMucLa = null;

  // Nếu tìm thấy đường dẫn danh mục thì lấy danh mục đầu và danh mục cuối.
  if (duongDanDanhMuc.length > 0) {
    danhMucGoc = duongDanDanhMuc[0];
    danhMucLa = duongDanDanhMuc[duongDanDanhMuc.length - 1];
  }

  // Biến này lưu slug danh mục gốc để tìm sản phẩm liên quan.
  let slugDanhMucGoc = undefined;

  if (danhMucGoc !== null) {
    if (danhMucGoc.slug !== undefined) {
      slugDanhMucGoc = danhMucGoc.slug;
    }
  }

  // Hook này gọi API lấy các sản phẩm cùng danh mục gốc.
  const ketQuaSanPhamLienQuan = useSanPhamLienQuan(
    slugDanhMucGoc,
    maSanPham,
  );

  // Biến này lưu giá trị thô của tham số variant trên đường dẫn.
  const maPhienBanTho = thamSoTimKiem.get("variant");

  // Biến này lưu mã phiên bản đang được chọn, mặc định là null khi tham số không dùng được.
  let maPhienBanDangChon = null;

  // Nếu tham số có giá trị thì mới kiểm tra tiếp.
  if (maPhienBanTho !== null) {
    if (maPhienBanTho !== "") {
      // Biến này lưu mã phiên bản sau khi chuyển sang dạng số.
      const maPhienBanSo = Number(maPhienBanTho);

      // Chỉ chấp nhận mã phiên bản là số nguyên dương.
      if (Number.isInteger(maPhienBanSo) === true) {
        if (maPhienBanSo > 0) {
          maPhienBanDangChon = maPhienBanSo;
        }
      }
    }
  }

  // Trạng thái này lưu số lượng sản phẩm người dùng muốn mua.
  const trangThaiSoLuong = useState(1);

  // Biến này lưu số lượng đang được chọn.
  const soLuongDangChon = trangThaiSoLuong[0];

  // Biến này lưu hàm cập nhật số lượng đang chọn.
  const capNhatSoLuong = trangThaiSoLuong[1];

  // Trạng thái này lưu nội dung thông báo hiển thị ở góc trang.
  const trangThaiThongBao = useState("");

  // Biến này lưu nội dung thông báo hiện tại.
  const thongBao = trangThaiThongBao[0];

  // Biến này lưu hàm cập nhật nội dung thông báo.
  const capNhatThongBao = trangThaiThongBao[1];

  // useRef lưu mã hẹn giờ mà không gây render lại thành phần.
  const thamChieuHenGio = useRef();

  // useMutation tạo thao tác thêm sản phẩm vào giỏ hàng.
  const thaoTacThemVaoGio = useMutation({ mutationFn: themVaoGioHang });

  // Biến này lưu danh sách phiên bản của sản phẩm.
  let danhSachPhienBan = [];

  if (sanPham !== null) {
    if (Array.isArray(sanPham.variants) === true) {
      danhSachPhienBan = sanPham.variants;
    }
  }

  // Biến này lưu phiên bản mặc định, ưu tiên phiên bản còn hàng đầu tiên.
  let phienBanMacDinh = null;

  for (const phienBan of danhSachPhienBan) {
    if (phienBan.stockQuantity > 0) {
      phienBanMacDinh = phienBan;
      break;
    }
  }

  // Nếu không có phiên bản nào còn hàng thì dùng phiên bản đầu tiên.
  if (phienBanMacDinh === null) {
    if (danhSachPhienBan.length > 0) {
      phienBanMacDinh = danhSachPhienBan[0];
    }
  }

  // Biến này lưu phiên bản đang được chọn trên giao diện.
  let phienBanDangChon = null;

  // Nếu người dùng đã chọn một phiên bản thì tìm lại phiên bản đó trong dữ liệu.
  if (maPhienBanDangChon !== null) {
    for (const phienBan of danhSachPhienBan) {
      if (phienBan.id === maPhienBanDangChon) {
        phienBanDangChon = phienBan;
        break;
      }
    }
  }

  // Nếu chưa chọn hoặc không tìm thấy thì dùng phiên bản mặc định.
  if (phienBanDangChon === null) {
    phienBanDangChon = phienBanMacDinh;
  }

  // Biến này lưu số lượng tồn kho của phiên bản đang chọn.
  let soLuongTonKho = 0;

  if (phienBanDangChon !== null) {
    if (phienBanDangChon.stockQuantity !== undefined) {
      if (phienBanDangChon.stockQuantity !== null) {
        soLuongTonKho = phienBanDangChon.stockQuantity;
      }
    }
  }

  // Biến này lưu số lượng tối đa người dùng có thể chọn.
  let soLuongToiDa = 1;

  if (soLuongTonKho > 1) {
    soLuongToiDa = soLuongTonKho;
  }

  // Biến này lưu số lượng thực tế sẽ hiển thị và gửi lên backend.
  let soLuongHienThi = soLuongDangChon;

  if (soLuongHienThi > soLuongToiDa) {
    soLuongHienThi = soLuongToiDa;
  }

  if (soLuongHienThi < 1) {
    soLuongHienThi = 1;
  }

  // Biến này cho biết phiên bản đang chọn còn hàng hay không.
  let conHang = false;

  if (soLuongTonKho > 0) {
    conHang = true;
  }

  // Biến này lưu giá thấp nhất trong danh sách phiên bản.
  let giaThapNhatCuaPhienBan = 0;

  if (danhSachPhienBan.length > 0) {
    giaThapNhatCuaPhienBan = Number(danhSachPhienBan[0].priceMinor);

    // Biến này lưu vị trí phiên bản đang xét.
    let chiSoPhienBan = 1;

    while (chiSoPhienBan < danhSachPhienBan.length) {
      const giaPhienBan = Number(danhSachPhienBan[chiSoPhienBan].priceMinor);

      if (giaPhienBan < giaThapNhatCuaPhienBan) {
        giaThapNhatCuaPhienBan = giaPhienBan;
      }

      chiSoPhienBan += 1;
    }
  }

  // Biến này lưu giá sẽ hiển thị trên trang.
  let giaHienThi = giaThapNhatCuaPhienBan;

  if (phienBanDangChon !== null) {
    if (phienBanDangChon.priceMinor !== undefined) {
      if (phienBanDangChon.priceMinor !== null) {
        giaHienThi = phienBanDangChon.priceMinor;
      }
    }
  }

  // Biến này lưu danh sách đánh giá chi tiết.
  let danhSachDanhGia = [];
  const duLieuDanhGia = ketQuaDanhGia.data;

  if (duLieuDanhGia !== undefined) {
    if (duLieuDanhGia !== null) {
      if (Array.isArray(duLieuDanhGia.items) === true) {
        danhSachDanhGia = duLieuDanhGia.items;
      }
    }
  }

  // Biến này lưu danh sách sản phẩm liên quan.
  let danhSachSanPhamLienQuan = [];
  const duLieuSanPhamLienQuan = ketQuaSanPhamLienQuan.data;

  if (duLieuSanPhamLienQuan !== undefined) {
    if (Array.isArray(duLieuSanPhamLienQuan) === true) {
      danhSachSanPhamLienQuan = duLieuSanPhamLienQuan;
    }
  }

  // Hàm này cập nhật tiêu đề tài liệu theo tên sản phẩm.
  function xuLyCapNhatTieuDeTaiLieu() {
    if (sanPham === null) {
      return undefined;
    }

    document.title = sanPham.name + " | MarketHub";

    // Hàm này khôi phục tiêu đề mặc định khi rời trang.
    function xuLyKhoiPhucTieuDe() {
      document.title = TIEU_DE_MAC_DINH;
    }

    return xuLyKhoiPhucTieuDe;
  }

  // Hàm này xoá hẹn giờ thông báo còn treo khi thành phần bị gỡ khỏi giao diện.
  function xuLyDonDepHenGio() {
    const maHenGio = thamChieuHenGio.current;

    if (maHenGio !== undefined) {
      window.clearTimeout(maHenGio);
    }
  }

  // useEffect chạy hàm cuộn lên đầu trang sau khi thành phần được gắn vào giao diện.
  useEffect(cuonLenDauTrang, []);

  // useEffect cập nhật tiêu đề tài liệu mỗi khi sản phẩm thay đổi.
  useEffect(xuLyCapNhatTieuDeTaiLieu, [sanPham]);

  // useEffect chạy hàm dọn dẹp hẹn giờ sau khi thành phần được gắn vào giao diện.
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

  // Hàm này xử lý khi người dùng chọn một phiên bản khác.
  // Mã phiên bản được ghi lên đường dẫn để tải lại trang vẫn giữ đúng lựa chọn.
  function xuLyChonPhienBan(phienBanMoi) {
    const cacThayDoi = { variant: phienBanMoi.id };
    const thamSoMoi = taoThamSoTimKiemDaCapNhat(thamSoTimKiem, cacThayDoi);

    capNhatSoLuong(1);
    capNhatThamSoTimKiem(thamSoMoi);
  }

  // Hàm này tính số lượng mới sau khi giảm một đơn vị.
  function taoSoLuongSauKhiGiam(soLuongHienTai) {
    let soLuongMoi = soLuongHienTai - 1;

    if (soLuongMoi < 1) {
      soLuongMoi = 1;
    }

    if (soLuongMoi > soLuongToiDa) {
      soLuongMoi = soLuongToiDa;
    }

    return soLuongMoi;
  }

  // Hàm này giảm số lượng sản phẩm đi một đơn vị.
  function xuLyGiamSoLuong() {
    capNhatSoLuong(taoSoLuongSauKhiGiam);
  }

  // Hàm này tính số lượng mới sau khi tăng một đơn vị.
  function taoSoLuongSauKhiTang(soLuongHienTai) {
    let soLuongMoi = soLuongHienTai + 1;

    if (soLuongMoi < 1) {
      soLuongMoi = 1;
    }

    if (soLuongMoi > soLuongToiDa) {
      soLuongMoi = soLuongToiDa;
    }

    return soLuongMoi;
  }

  // Hàm này tăng số lượng sản phẩm lên một đơn vị.
  function xuLyTangSoLuong() {
    capNhatSoLuong(taoSoLuongSauKhiTang);
  }

  // Hàm này xử lý khi người dùng nhập số lượng trực tiếp.
  function xuLyNhapSoLuong(suKienNhap) {
    const soLuongNhap = Number(suKienNhap.target.value);

    // Nếu giá trị nhập không phải số thì đưa về 1.
    if (Number.isFinite(soLuongNhap) === false) {
      capNhatSoLuong(1);
      return;
    }

    // Biến này lưu số lượng sau khi bỏ phần thập phân.
    let soLuongMoi = Math.trunc(soLuongNhap);

    if (soLuongMoi < 1) {
      soLuongMoi = 1;
    }

    if (soLuongMoi > soLuongToiDa) {
      soLuongMoi = soLuongToiDa;
    }

    capNhatSoLuong(soLuongMoi);
  }

  // Hàm này thêm phiên bản đang chọn vào giỏ hàng.
  // Tham số chuyenSangTrangGio cho biết có chuyển thẳng tới trang giỏ hàng hay không.
  function xuLyThemPhienBanVaoGio(chuyenSangTrangGio) {
    if (kiemTraDaDangNhap() === false) {
      hienThiThongBao("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    if (phienBanDangChon === null) {
      hienThiThongBao("Sản phẩm này chưa có phiên bản để mua.");
      return;
    }

    if (conHang === false) {
      hienThiThongBao("Phiên bản này đã hết hàng.");
      return;
    }

    // Biến này lưu dữ liệu gửi lên API thêm vào giỏ.
    const duLieuGui = {
      variantId: phienBanDangChon.id,
      quantity: soLuongHienThi,
    };

    // Hàm này xử lý khi thêm vào giỏ thành công.
    function xuLyThemThanhCong() {
      boQuanLyTruyVan.invalidateQueries({ queryKey: ["cart"] });

      // Nếu người dùng chọn mua ngay thì chuyển tới trang giỏ hàng.
      if (chuyenSangTrangGio === true) {
        hamDieuHuong("/cart");
        return;
      }

      capNhatSoLuong(1);

      if (sanPham !== null) {
        hienThiThongBao('Đã thêm "' + sanPham.name + '" vào giỏ hàng.');
      }
    }

    // Hàm này xử lý khi thêm vào giỏ thất bại.
    function xuLyThemThatBai(loi) {
      // Biến này lưu nội dung lỗi mặc định.
      let noiDungLoi = "Không thêm được vào giỏ hàng. Vui lòng thử lại.";

      // Nếu lỗi có phản hồi từ backend thì kiểm tra mã trạng thái.
      if (loi.response !== undefined) {
        if (loi.response !== null) {
          if (loi.response.status === 401) {
            noiDungLoi =
              "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          }
        }
      }

      hienThiThongBao(noiDungLoi);
    }

    const tuyChonThaoTac = {
      onSuccess: xuLyThemThanhCong,
      onError: xuLyThemThatBai,
    };

    thaoTacThemVaoGio.mutate(duLieuGui, tuyChonThaoTac);
  }

  // Hàm này xử lý nút thêm vào giỏ.
  function xuLyThemVaoGio() {
    xuLyThemPhienBanVaoGio(false);
  }

  // Hàm này xử lý nút mua ngay.
  function xuLyMuaNgay() {
    xuLyThemPhienBanVaoGio(true);
  }

  // Hàm này thêm nhanh một sản phẩm liên quan vào giỏ hàng.
  function xuLyThemNhanhSanPhamLienQuan(sanPhamLienQuan) {
    if (kiemTraDaDangNhap() === false) {
      hienThiThongBao("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    // Biến này lưu danh sách phiên bản của sản phẩm liên quan.
    let danhSachPhienBanLienQuan = [];

    if (Array.isArray(sanPhamLienQuan.variants) === true) {
      danhSachPhienBanLienQuan = sanPhamLienQuan.variants;
    }

    // Biến này lưu phiên bản đầu tiên còn hàng.
    let phienBanConHang = null;

    for (const phienBan of danhSachPhienBanLienQuan) {
      if (phienBan.stockQuantity > 0) {
        phienBanConHang = phienBan;
        break;
      }
    }

    if (phienBanConHang === null) {
      hienThiThongBao("Sản phẩm này đã hết hàng.");
      return;
    }

    const duLieuGui = {
      variantId: phienBanConHang.id,
      quantity: 1,
    };

    // Hàm này xử lý khi thêm sản phẩm liên quan thành công.
    function xuLyThemThanhCong() {
      boQuanLyTruyVan.invalidateQueries({ queryKey: ["cart"] });
      hienThiThongBao(
        'Đã thêm "' + sanPhamLienQuan.name + '" vào giỏ hàng.',
      );
    }

    // Hàm này xử lý khi thêm sản phẩm liên quan thất bại.
    function xuLyThemThatBai() {
      hienThiThongBao("Không thêm được vào giỏ hàng. Vui lòng thử lại.");
    }

    const tuyChonThaoTac = {
      onSuccess: xuLyThemThanhCong,
      onError: xuLyThemThatBai,
    };

    thaoTacThemVaoGio.mutate(duLieuGui, tuyChonThaoTac);
  }

  // Hàm này gọi lại API chi tiết sản phẩm khi người dùng bấm thử lại.
  function xuLyThuLai() {
    ketQuaSanPham.refetch();
  }

  // Nếu sản phẩm đang được tải lần đầu thì hiển thị trạng thái tải.
  if (ketQuaSanPham.isLoading === true) {
    return (
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>Đang tải sản phẩm…</span>
        </nav>
        <div className="catalog-state" role="status">
          <h1>Đang tải sản phẩm…</h1>
          <p>Dữ liệu đang được lấy từ MarketHub.</p>
        </div>
      </div>
    );
  }

  // Nếu tải sản phẩm bị lỗi thì hiển thị thông báo phù hợp.
  if (ketQuaSanPham.isError === true) {
    // Biến này cho biết lỗi là do không tìm thấy sản phẩm hay do lỗi khác.
    let laLoiKhongTimThay = false;

    if (ketQuaSanPham.error !== undefined) {
      if (ketQuaSanPham.error !== null) {
        if (ketQuaSanPham.error.response !== undefined) {
          if (ketQuaSanPham.error.response !== null) {
            if (ketQuaSanPham.error.response.status === 404) {
              laLoiKhongTimThay = true;
            }
          }
        }
      }
    }

    // Biến này lưu nhãn breadcrumb theo loại lỗi.
    let nhanBreadcrumb = "Lỗi tải sản phẩm";

    if (laLoiKhongTimThay === true) {
      nhanBreadcrumb = "Không tìm thấy sản phẩm";
    }

    // Biến này lưu tiêu đề của trạng thái lỗi.
    let tieuDeLoi = "Không tải được sản phẩm";

    if (laLoiKhongTimThay === true) {
      tieuDeLoi = "Không tìm thấy sản phẩm";
    }

    // Biến này lưu mô tả của trạng thái lỗi.
    let moTaLoi = "Kiểm tra backend và MySQL đang chạy, sau đó thử lại.";

    if (laLoiKhongTimThay === true) {
      moTaLoi =
        "Sản phẩm có thể đã ngừng bán hoặc đường dẫn không còn đúng.";
    }

    // Phần tử này hiển thị nút thử lại khi lỗi không phải do không tìm thấy.
    let phanTuThuLai = null;

    if (laLoiKhongTimThay === false) {
      phanTuThuLai = (
        <button className="btn" type="button" onClick={xuLyThuLai}>
          Thử lại
        </button>
      );
    }

    return (
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>{nhanBreadcrumb}</span>
        </nav>
        <div className="catalog-state" role="alert">
          <h1>{tieuDeLoi}</h1>
          <p>{moTaLoi}</p>
          {phanTuThuLai}
          <Link className="btn" to="/products">
            Về danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  // Nếu tải xong mà không có sản phẩm thì hiển thị trang không tìm thấy.
  if (sanPham === null) {
    return <TrangKhongTimThay />;
  }

  // Biến này lưu mô tả sản phẩm, có giá trị mặc định khi mô tả còn trống.
  let moTaSanPham = "Sản phẩm đang được cập nhật mô tả chi tiết.";

  if (sanPham.description !== undefined) {
    if (sanPham.description !== null) {
      const moTaDaCat = sanPham.description.trim();

      if (moTaDaCat !== "") {
        moTaSanPham = moTaDaCat;
      }
    }
  }

  // Biến này lưu nội dung đánh giá hiển thị dưới tiêu đề sản phẩm.
  let noiDungDanhGia = "Chưa có đánh giá";

  if (sanPham.ratingCount > 0) {
    const diemTrungBinh = Number(sanPham.ratingAvg);
    const diemDaRutGon = diemTrungBinh.toFixed(1);
    noiDungDanhGia =
      diemDaRutGon + " · " + sanPham.ratingCount + " đánh giá";
  }

  // Biến này lưu thông báo tình trạng kho của phiên bản đang chọn.
  let noiDungTonKho =
    "Tạm hết hàng · Vui lòng chọn phiên bản khác";

  if (conHang === true) {
    if (phienBanDangChon !== null) {
      noiDungTonKho =
        "Còn " +
        phienBanDangChon.stockQuantity +
        " sản phẩm · Giao trong 2-4 ngày";
    }
  }

  // Biến này lưu đường dẫn danh sách sản phẩm theo danh mục gốc.
  let duongDanDanhSachTheoDanhMuc = "/products";

  if (danhMucGoc !== null) {
    duongDanDanhSachTheoDanhMuc =
      "/products?category=" + encodeURIComponent(danhMucGoc.slug);
  }

  // Cửa hàng là một thương hiệu duy nhất nên luôn hiển thị tên MarketHub.
  const tenCuaHang = "MarketHub Official";

  // Biến này lưu tên danh mục lá, có giá trị mặc định khi chưa xác định được.
  let tenDanhMucLa = "Sản phẩm";

  if (danhMucLa !== null) {
    tenDanhMucLa = danhMucLa.name;
  }

  // Biến này lưu nội dung đánh giá trong bảng thông số.
  let noiDungDanhGiaThongSo = "Chưa có đánh giá";

  if (sanPham.ratingCount > 0) {
    const diemTrungBinhThongSo = Number(sanPham.ratingAvg);
    const diemThongSoDaRutGon = diemTrungBinhThongSo.toFixed(1);
    noiDungDanhGiaThongSo =
      diemThongSoDaRutGon +
      " / 5 · " +
      sanPham.ratingCount +
      " đánh giá";
  }

  // Biến này lưu nội dung tình trạng trong bảng thông số.
  let noiDungTinhTrang = "Tạm hết hàng";

  if (conHang === true) {
    if (phienBanDangChon !== null) {
      noiDungTinhTrang = "Còn " + phienBanDangChon.stockQuantity + " sản phẩm";
    }
  }

  // Biến này cho biết các nút mua hàng có bị vô hiệu hoá hay không.
  let khongTheThem = false;

  if (thaoTacThemVaoGio.isPending === true) {
    khongTheThem = true;
  }

  if (conHang === false) {
    khongTheThem = true;
  }

  // Biến này lưu nhãn của nút thêm vào giỏ.
  let nhanNutThem = "Thêm vào giỏ";

  if (thaoTacThemVaoGio.isPending === true) {
    nhanNutThem = "Đang thêm…";
  }

  // Phần tử này hiển thị liên kết tới danh mục gốc trong breadcrumb.
  let phanTuDanhMucGoc = null;

  if (danhMucGoc !== null) {
    phanTuDanhMucGoc = (
      <>
        <Link to={duongDanDanhSachTheoDanhMuc}>{danhMucGoc.name}</Link>
        <span>/</span>
      </>
    );
  }

  // Phần tử này hiển thị khu vực sản phẩm liên quan khi có dữ liệu.
  let phanTuSanPhamLienQuan = null;

  if (danhSachSanPhamLienQuan.length > 0) {
    // Mảng này lưu các thẻ sản phẩm liên quan.
    const cacTheSanPhamLienQuan = [];

    for (const sanPhamLienQuan of danhSachSanPhamLienQuan) {
      cacTheSanPhamLienQuan.push(
        <TheSanPham
          key={sanPhamLienQuan.id}
          sanPham={sanPhamLienQuan}
          khiThemNhanh={xuLyThemNhanhSanPhamLienQuan}
        />,
      );
    }

    phanTuSanPhamLienQuan = (
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Có thể bạn cũng thích</h2>
          </div>
          <div className="section-head__aside">
            <Link className="link" to={duongDanDanhSachTheoDanhMuc}>
              Xem tất cả <ArrowRight className="icon icon--sm" />
            </Link>
          </div>
        </div>
        <div className="product-grid">{cacTheSanPhamLienQuan}</div>
      </section>
    );
  }

  // Biến này lưu tên lớp của thông báo, có thêm lớp hiển thị khi có nội dung.
  let tenLopThongBao = "toast";

  if (thongBao !== "") {
    tenLopThongBao += " is-visible";
  }

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        {phanTuDanhMucGoc}
        <span aria-current="page">{sanPham.name}</span>
      </nav>

      <div className="pdp">
        <ThuVienAnhSanPham key={sanPham.id} sanPham={sanPham} />

        <div className="pdp-info">
          <div className="pdp-brand">
            <span>{tenCuaHang}</span>
            <span>{tenDanhMucLa}</span>
          </div>

          <h1 className="pdp-title">{sanPham.name}</h1>

          <div className="pdp-rating">
            <HienThiSaoDanhGia rating={sanPham.ratingAvg} />
            <span>{noiDungDanhGia}</span>
            <span>Đã bán {sanPham.soldCount}</span>
          </div>

          <div className="pdp-price">
            {dinhDangTien(giaHienThi)}{" "}
            <small>Giá đã bao gồm VAT</small>
          </div>

          <p className="pdp-desc">{moTaSanPham}</p>

          <ChonPhienBan
            danhSachPhienBan={danhSachPhienBan}
            phienBanDangChon={phienBanDangChon}
            khiChonPhienBan={xuLyChonPhienBan}
          />

          <div className="buy-row">
            <div className="qty">
              <button
                type="button"
                onClick={xuLyGiamSoLuong}
                disabled={soLuongHienThi <= 1}
                aria-label="Giảm số lượng"
              >
                <Minus className="icon icon--sm" />
              </button>
              <label className="sr-only" htmlFor="product-quantity">
                Số lượng
              </label>
              <input
                id="product-quantity"
                type="number"
                min="1"
                max={soLuongToiDa}
                value={soLuongHienThi}
                onChange={xuLyNhapSoLuong}
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={xuLyTangSoLuong}
                disabled={soLuongHienThi >= soLuongToiDa}
                aria-label="Tăng số lượng"
              >
                <Plus className="icon icon--sm" />
              </button>
            </div>

            <button
              className="btn btn--primary"
              type="button"
              onClick={xuLyThemVaoGio}
              disabled={khongTheThem}
            >
              {nhanNutThem}
              <ShoppingBag className="icon icon--sm" />
            </button>
          </div>

          <div className="pdp-actions">
            <button
              className="btn"
              type="button"
              onClick={xuLyMuaNgay}
              disabled={khongTheThem}
            >
              Mua ngay
            </button>
          </div>

          <div className="stock-note">
            <CheckCircle2 className="icon icon--sm" />
            {noiDungTonKho}
          </div>

          <div className="assurance">
            <div className="assurance__row">
              <Truck className="icon" />
              <div>
                <strong>Giao hàng toàn quốc</strong>
                <span>Miễn phí cho đơn từ 499.000₫.</span>
              </div>
            </div>
            <div className="assurance__row">
              <RotateCcw className="icon" />
              <div>
                <strong>Đổi trả 30 ngày</strong>
                <span>Hàng còn nguyên tem và đúng tình trạng.</span>
              </div>
            </div>
            <div className="assurance__row">
              <ShieldCheck className="icon" />
              <div>
                <strong>Bảo hành 12 tháng</strong>
                <span>Tiếp nhận qua cửa hàng chính thức.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pdp-sections">
        <section className="pdp-section" id="mo-ta">
          <h2>Mô tả</h2>
          <div>
            <p className="pdp-desc" style={{ marginTop: 0 }}>
              {moTaSanPham}
            </p>
            <p className="pdp-desc">
              Giá niêm yết đã bao gồm VAT. Tồn kho được cập nhật theo từng
              phiên bản.
            </p>
          </div>
        </section>

        <section className="pdp-section" id="thong-so">
          <h2>Thông số</h2>
          <table className="spec-table">
            <tbody>
              <tr>
                <th>Mã sản phẩm</th>
                <td>M{sanPham.id}</td>
              </tr>
              <tr>
                <th>Danh mục</th>
                <td>{tenDanhMucLa}</td>
              </tr>
              <tr>
                <th>Bảo hành</th>
                <td>12 tháng</td>
              </tr>
              <tr>
                <th>Tình trạng</th>
                <td>{noiDungTinhTrang}</td>
              </tr>
              <tr>
                <th>Đánh giá</th>
                <td>{noiDungDanhGiaThongSo}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <DanhGiaSanPham
          diemTrungBinh={sanPham.ratingAvg}
          soLuongDanhGia={sanPham.ratingCount}
          danhSachDanhGia={danhSachDanhGia}
          dangTai={ketQuaDanhGia.isLoading}
          coLoi={ketQuaDanhGia.isError}
        />
      </div>

      {phanTuSanPhamLienQuan}

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

// Thành phần này đọc mã sản phẩm trên đường dẫn,
// kiểm tra tính hợp lệ rồi hiển thị nội dung chi tiết tương ứng.
export default function TrangChiTietSanPham() {
  // useParams trả về các tham số động trên đường dẫn hiện tại.
  const thamSoDuongDan = useParams();

  // Biến này lưu giá trị thô của tham số productId trên đường dẫn.
  const maSanPhamTho = thamSoDuongDan.productId;

  // Biến này lưu mã sản phẩm sau khi chuyển sang dạng số.
  const maSanPham = Number(maSanPhamTho);

  // Nếu mã sản phẩm không phải số nguyên thì hiển thị trang không tìm thấy.
  if (Number.isInteger(maSanPham) === false) {
    return <TrangKhongTimThay />;
  }

  // Nếu mã sản phẩm không dương thì cũng hiển thị trang không tìm thấy.
  if (maSanPham <= 0) {
    return <TrangKhongTimThay />;
  }

  return (
    <NoiDungChiTietSanPham key={maSanPham} maSanPham={maSanPham} />
  );
}
