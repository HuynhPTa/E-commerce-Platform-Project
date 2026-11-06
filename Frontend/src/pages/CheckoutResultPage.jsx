import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  CircleAlert,
  CircleCheck,
  Clock3,
  CreditCard,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { taoDuongDanThanhToan } from "../api/checkoutApi.js";
import { useAuth } from "../hooks/useAuth.js";
import { useKetQuaThanhToan } from "../hooks/useCheckout.js";
import { layThongDiepLoiBackend } from "../lib/authError.js";
import { dinhDangTien } from "../lib/formatMoney.js";

// Tiêu đề mặc định của tài liệu khi rời trang kết quả.
const TIEU_DE_MAC_DINH = "Tất cả sản phẩm | MarketHub";

// Hàm này trả về nhãn và mô tả của một trạng thái phiên thanh toán.
function layThongTinTrangThaiPhien(trangThai) {
  if (trangThai === "PAID") {
    return {
      tieuDe: "Đặt hàng thành công",
      moTa: "Thanh toán đã được ghi nhận. Đơn hàng đang chờ MarketHub xác nhận.",
    };
  }

  if (trangThai === "FAILED") {
    return {
      tieuDe: "Thanh toán thất bại",
      moTa: "Giao dịch thanh toán không thành công. Bạn có thể thử thanh toán lại hoặc liên hệ MarketHub để được hỗ trợ.",
    };
  }

  if (trangThai === "EXPIRED") {
    return {
      tieuDe: "Phiên thanh toán đã hết hạn",
      moTa: "Phiên thanh toán không còn khả dụng. Vui lòng đặt lại đơn hàng nếu bạn vẫn muốn mua sản phẩm.",
    };
  }

  return {
    tieuDe: "Đơn hàng đã được ghi nhận",
    moTa: "Đơn hàng đã được tạo và giữ tồn kho. Hoàn tất thanh toán để MarketHub xác nhận đơn.",
  };
}

// Hàm này trả về nhãn tiếng Việt của một trạng thái đơn hàng.
function layNhanTrangThaiDonHang(trangThai) {
  if (trangThai === "PENDING") {
    return "Chờ xác nhận";
  }

  if (trangThai === "CONFIRMED") {
    return "Đã xác nhận";
  }

  if (trangThai === "SHIPPING") {
    return "Đang giao";
  }

  if (trangThai === "DELIVERED") {
    return "Đã giao";
  }

  if (trangThai === "COMPLETED") {
    return "Hoàn tất";
  }

  if (trangThai === "CANCELLED") {
    return "Đã huỷ";
  }

  return trangThai;
}

// Hàm này trả về nhãn tiếng Việt của một trạng thái thanh toán.
function layNhanTrangThaiThanhToan(trangThai) {
  if (trangThai === undefined) {
    return "Chưa tạo giao dịch";
  }

  if (trangThai === null) {
    return "Chưa tạo giao dịch";
  }

  if (trangThai === "PENDING") {
    return "Chờ thanh toán";
  }

  if (trangThai === "SUCCEEDED") {
    return "Đã thanh toán";
  }

  if (trangThai === "FAILED") {
    return "Thanh toán thất bại";
  }

  if (trangThai === "REFUND_REQUIRED") {
    return "Cần hoàn tiền";
  }

  if (typeof trangThai !== "string") {
    return "Không xác định";
  }

  if (trangThai === "") {
    return "Không xác định";
  }

  return trangThai;
}

// Hàm này trả về nhãn tiếng Việt của một cổng thanh toán.
function layNhanPhuongThucThanhToan(phuongThuc) {
  if (phuongThuc === "VNPAY") {
    return "VNPay";
  }

  if (phuongThuc === "MOMO") {
    return "MoMo";
  }

  if (typeof phuongThuc !== "string") {
    return "Không xác định";
  }

  if (phuongThuc === "") {
    return "Không xác định";
  }

  return phuongThuc;
}

// Hàm này kiểm tra lỗi trả về có phải do phiên đăng nhập đã hết hạn hay không.
function kiemTraLaLoiHetPhien(loi) {
  if (loi === undefined) {
    return false;
  }

  if (loi === null) {
    return false;
  }

  if (loi.response !== undefined) {
    if (loi.response !== null) {
      if (loi.response.status === 401) {
        return true;
      }
    }
  }

  return false;
}

// Hàm này lấy mã trạng thái HTTP do backend trả về.
function layMaTrangThaiHttp(loi) {
  if (loi === undefined) {
    return undefined;
  }

  if (loi === null) {
    return undefined;
  }

  if (loi.response === undefined) {
    return undefined;
  }

  if (loi.response === null) {
    return undefined;
  }

  return loi.response.status;
}

// Thành phần này hiển thị trang kết quả thanh toán của cửa hàng.
export default function TrangKetQuaThanhToan() {
  // useAuth trả về trạng thái đăng nhập hiện tại.
  const trangThaiDangNhap = useAuth();

  // Biến này cho biết người dùng đã đăng nhập hay chưa.
  const daDangNhap = trangThaiDangNhap.daDangNhap;

  // useSearchParams trả về bộ tham số trên đường dẫn hiện tại.
  const capThamSoTimKiem = useSearchParams();

  // Biến này lưu bộ tham số tìm kiếm hiện tại.
  const thamSoTimKiem = capThamSoTimKiem[0];

  // useLocation trả về thông tin về đường dẫn hiện tại.
  const thongTinDuongDan = useLocation();

  // Biến này lưu mã phiên thanh toán đọc từ tham số checkoutId.
  let maPhienThanhToan = 0;
  const giaTriCheckoutId = thamSoTimKiem.get("checkoutId");

  if (giaTriCheckoutId !== null) {
    const soMaPhien = Number(giaTriCheckoutId);

    if (Number.isInteger(soMaPhien) === true) {
      if (soMaPhien > 0) {
        maPhienThanhToan = soMaPhien;
      }
    }
  }

  // Hook này đọc lại kết quả thật của phiên thanh toán từ backend.
  const ketQuaThanhToan = useKetQuaThanhToan(
    maPhienThanhToan,
    daDangNhap,
  );

  // Trạng thái này cho biết đang tạo lại giao dịch thanh toán hay không.
  const trangThaiDangTaoThanhToan = useState(false);

  // Biến này lưu trạng thái đang tạo giao dịch.
  const dangTaoThanhToan = trangThaiDangTaoThanhToan[0];

  // Biến này lưu hàm cập nhật trạng thái đang tạo giao dịch.
  const capNhatDangTaoThanhToan = trangThaiDangTaoThanhToan[1];

  // Trạng thái này lưu lỗi phát sinh khi tạo giao dịch thanh toán.
  const trangThaiLoiThanhToan = useState("");

  // Biến này lưu nội dung lỗi thanh toán hiện tại.
  const loiThanhToan = trangThaiLoiThanhToan[0];

  // Biến này lưu hàm cập nhật lỗi thanh toán.
  const capNhatLoiThanhToan = trangThaiLoiThanhToan[1];

  // Hàm này cập nhật tiêu đề tài liệu khi mở trang kết quả.
  function xuLyCapNhatTieuDeTaiLieu() {
    document.title = "Kết quả thanh toán | MarketHub";

    // Hàm này khôi phục tiêu đề mặc định khi rời trang.
    function xuLyKhoiPhucTieuDe() {
      document.title = TIEU_DE_MAC_DINH;
    }

    return xuLyKhoiPhucTieuDe;
  }

  // useEffect cập nhật tiêu đề tài liệu sau khi trang được gắn vào giao diện.
  useEffect(xuLyCapNhatTieuDeTaiLieu, []);

  // Đường dẫn này dùng để quay lại đúng trang kết quả sau khi đăng nhập.
  let duongDanQuayLai = thongTinDuongDan.pathname;

  if (typeof thongTinDuongDan.search === "string") {
    if (thongTinDuongDan.search !== "") {
      duongDanQuayLai = duongDanQuayLai + thongTinDuongDan.search;
    }
  }

  // Đường dẫn này đưa người dùng tới trang đăng nhập kèm tham số quay lại.
  const duongDanDangNhap =
    "/login?redirect=" + encodeURIComponent(duongDanQuayLai);

  // Hàm này tạo lại đường dẫn thanh toán cho phiên đang mở.
  async function xuLyThanhToanLai() {
    const duLieuHienTai = ketQuaThanhToan.data;

    if (duLieuHienTai === undefined) {
      return;
    }

    if (duLieuHienTai === null) {
      return;
    }

    if (dangTaoThanhToan === true) {
      return;
    }

    capNhatDangTaoThanhToan(true);
    capNhatLoiThanhToan("");

    const duLieuYeuCau = {
      checkoutSessionId: duLieuHienTai.checkoutSessionId,
      provider: duLieuHienTai.paymentMethod,
    };

    try {
      const ketQuaTaoUrl = await taoDuongDanThanhToan(duLieuYeuCau);

      // Biến này lưu đường dẫn chuyển sang cổng thanh toán.
      let duongDanThanhToan = "";

      if (typeof ketQuaTaoUrl.redirectUrl === "string") {
        duongDanThanhToan = ketQuaTaoUrl.redirectUrl;
      }

      if (duongDanThanhToan !== "") {
        window.location.assign(duongDanThanhToan);
        return;
      }

      capNhatLoiThanhToan(
        "Cổng thanh toán không trả về đường dẫn. Vui lòng thử lại.",
      );
      capNhatDangTaoThanhToan(false);
    } catch (loi) {
      let thongDiepLoi = layThongDiepLoiBackend(
        loi,
        "Không tạo được giao dịch thanh toán. Vui lòng thử lại.",
      );

      // Bổ sung ghi chú khi cổng thanh toán chưa được cấu hình.
      if (layMaTrangThaiHttp(loi) === 503) {
        // Thêm dấu chấm nếu thông điệp backend chưa có dấu kết câu.
        if (thongDiepLoi.endsWith(".") === false) {
          thongDiepLoi = thongDiepLoi + ".";
        }

        thongDiepLoi = thongDiepLoi + " Đơn hàng vẫn được ghi nhận.";
      }

      capNhatLoiThanhToan(thongDiepLoi);
      capNhatDangTaoThanhToan(false);
    }
  }

  // Phần tử này hiển thị nội dung chính theo trạng thái của trang.
  let noiDungChinh;

  // Nếu chưa đăng nhập thì yêu cầu đăng nhập trước khi xem kết quả.
  if (daDangNhap === false) {
    noiDungChinh = (
      <div className="result-card">
        <div className="result-mark result-mark--warning">
          <Clock3 className="icon icon--lg" />
        </div>
        <h1>Đăng nhập để xem kết quả</h1>
        <p>Kết quả thanh toán được gắn với tài khoản đã đặt hàng.</p>
        <div className="btn-row">
          <Link className="btn btn--primary" to={duongDanDangNhap}>
            Đăng nhập
          </Link>
          <Link className="btn" to="/products">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  } else if (maPhienThanhToan <= 0) {
    noiDungChinh = (
      <div className="result-card">
        <div className="result-mark result-mark--danger">
          <CircleAlert className="icon icon--lg" />
        </div>
        <h1>Không xác định được phiên thanh toán</h1>
        <p>Đường dẫn kết quả không hợp lệ hoặc đã bị cắt.</p>
        <div className="btn-row">
          <Link className="btn btn--primary" to="/cart">
            Về giỏ hàng
          </Link>
          <Link className="btn" to="/products">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  } else if (ketQuaThanhToan.isLoading === true) {
    noiDungChinh = (
      <div className="result-card" role="status">
        <h1>Đang tải kết quả…</h1>
        <p>MarketHub đang đọc trạng thái mới nhất của phiên thanh toán.</p>
      </div>
    );
  } else if (ketQuaThanhToan.isError === true) {
    // Biến này cho biết lỗi có phải do phiên đăng nhập đã hết hạn hay không.
    const laLoiHetPhien = kiemTraLaLoiHetPhien(ketQuaThanhToan.error);

    // Biến này lưu thông điệp lỗi hiển thị cho người dùng.
    const thongDiepLoi = layThongDiepLoiBackend(
      ketQuaThanhToan.error,
      "Không tải được kết quả đặt hàng. Vui lòng thử lại.",
    );

    // Phần tử này hiển thị hành động phù hợp với loại lỗi.
    let phanTuHanhDong = (
      <button
        className="btn btn--primary"
        type="button"
        onClick={function () {
          ketQuaThanhToan.refetch();
        }}
        disabled={ketQuaThanhToan.isFetching}
      >
        <RefreshCw className="icon icon--sm" /> Thử lại
      </button>
    );

    // Nếu phiên đăng nhập hết hạn thì mời người dùng đăng nhập lại.
    if (laLoiHetPhien === true) {
      phanTuHanhDong = (
        <Link className="btn btn--primary" to={duongDanDangNhap}>
          Đăng nhập lại
        </Link>
      );
    }

    noiDungChinh = (
      <div className="result-card" role="alert">
        <div className="result-mark result-mark--danger">
          <CircleAlert className="icon icon--lg" />
        </div>
        <h1>Không tải được kết quả đặt hàng</h1>
        <p>{thongDiepLoi}</p>
        <div className="btn-row">
          {phanTuHanhDong}
          <Link className="btn" to="/products">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  } else {
    // Biến này lưu dữ liệu kết quả sau khi kiểm tra null.
    let duLieuKetQua = null;
    const duLieuTruyVan = ketQuaThanhToan.data;

    if (duLieuTruyVan !== undefined) {
      if (duLieuTruyVan !== null) {
        duLieuKetQua = duLieuTruyVan;
      }
    }

    // Nếu backend không trả về dữ liệu thì hiển thị trạng thái lỗi.
    if (duLieuKetQua === null) {
      noiDungChinh = (
        <div className="result-card" role="alert">
          <div className="result-mark result-mark--danger">
            <CircleAlert className="icon icon--lg" />
          </div>
          <h1>Không tải được kết quả đặt hàng</h1>
          <p>Backend không trả về dữ liệu cho phiên thanh toán này.</p>
          <div className="btn-row">
            <Link className="btn btn--primary" to="/cart">
              Về giỏ hàng
            </Link>
            <Link className="btn" to="/products">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      );
    } else {
      // Biến này lưu trạng thái hiện tại của phiên thanh toán.
      let trangThaiPhien = "PENDING";

      if (typeof duLieuKetQua.status === "string") {
        trangThaiPhien = duLieuKetQua.status;
      }

      // Biến này lưu thông tin hiển thị của trạng thái phiên.
      let thongTinTrangThai = layThongTinTrangThaiPhien(trangThaiPhien);

      // Biến này cho biết phiên dùng phương thức thanh toán khi nhận hàng.
      let laThanhToanKhiNhanHang = false;

      if (duLieuKetQua.paymentMethod === "COD") {
        laThanhToanKhiNhanHang = true;
      }

      // Đơn COD không đi qua cổng thanh toán nên dùng thông điệp riêng.
      if (laThanhToanKhiNhanHang === true) {
        if (trangThaiPhien === "PENDING") {
          thongTinTrangThai = {
            tieuDe: "Đặt hàng thành công",
            moTa: "Đơn hàng đã được ghi nhận. Bạn thanh toán khi nhận hàng; MarketHub sẽ xác nhận đơn sớm.",
          };
        }

        // COD không có giao dịch trực tuyến nên không dùng câu "thanh toán thất bại".
        if (trangThaiPhien === "FAILED") {
          thongTinTrangThai = {
            tieuDe: "Đơn hàng đã bị huỷ",
            moTa: "Đơn thanh toán khi nhận hàng không còn hiệu lực. Vui lòng đặt lại đơn nếu bạn vẫn muốn mua sản phẩm.",
          };
        }

        if (trangThaiPhien === "EXPIRED") {
          thongTinTrangThai = {
            tieuDe: "Đơn hàng đã hết hạn",
            moTa: "Đơn thanh toán khi nhận hàng đã hết hạn xử lý. Vui lòng đặt lại đơn nếu bạn vẫn muốn mua sản phẩm.",
          };
        }
      }

      // Biến này lưu nhãn của cổng thanh toán.
      const nhanPhuongThuc = layNhanPhuongThucThanhToan(
        duLieuKetQua.paymentMethod,
      );

      // Biến này lưu nhãn của trạng thái thanh toán.
      let nhanTrangThaiThanhToan = layNhanTrangThaiThanhToan(
        duLieuKetQua.paymentStatus,
      );

      // COD chưa thu tiền nên hiển thị đúng hình thức thanh toán.
      if (laThanhToanKhiNhanHang === true) {
        if (duLieuKetQua.paymentStatus === "PENDING") {
          nhanTrangThaiThanhToan = "Thanh toán khi nhận hàng";
        }

        if (duLieuKetQua.paymentStatus === "FAILED") {
          nhanTrangThaiThanhToan = "Chưa thu tiền";
        }

        if (duLieuKetQua.paymentStatus === "SUCCEEDED") {
          nhanTrangThaiThanhToan = "Đã thu tiền khi giao hàng";
        }

        if (duLieuKetQua.paymentStatus === "REFUND_REQUIRED") {
          nhanTrangThaiThanhToan = "Cần hoàn tiền";
        }
      }

      // Biến này lưu danh sách đơn hàng trong phiên thanh toán.
      let danhSachDonHang = [];

      if (Array.isArray(duLieuKetQua.orders) === true) {
        danhSachDonHang = duLieuKetQua.orders;
      }

      // Biến này cho biết người dùng có thể tạo lại giao dịch thanh toán hay không.
      let coTheThanhToan = false;

      if (trangThaiPhien === "PENDING") {
        coTheThanhToan = true;
      }

      if (trangThaiPhien === "FAILED") {
        coTheThanhToan = true;
      }

      // Phiên không còn đơn hiệu lực hoặc tổng tiền bằng 0 thì không được thanh toán lại.
      let soDonConHieuLuc = 0;

      for (const donHang of danhSachDonHang) {
        if (donHang.status !== "CANCELLED") {
          soDonConHieuLuc = soDonConHieuLuc + 1;
        }
      }

      if (soDonConHieuLuc === 0) {
        coTheThanhToan = false;
      }

      const tongTienPhien = Number(duLieuKetQua.totalAmountMinor);

      if (Number.isFinite(tongTienPhien) === false) {
        coTheThanhToan = false;
      }

      if (tongTienPhien <= 0) {
        coTheThanhToan = false;
      }

      // Giao dịch đã thu tiền nhưng cần hoàn lại thì không tạo giao dịch mới.
      if (duLieuKetQua.paymentStatus === "REFUND_REQUIRED") {
        coTheThanhToan = false;
      }

      if (duLieuKetQua.paymentStatus === "SUCCEEDED") {
        coTheThanhToan = false;
      }

      // COD không có giao dịch trực tuyến để tạo lại.
      if (laThanhToanKhiNhanHang === true) {
        coTheThanhToan = false;
      }

      // Phần tử này hiển thị biểu tượng phù hợp với trạng thái phiên.
      let phanTuBieuTuong = <Clock3 className="icon icon--lg" />;
      let lopDauTrangThai = "result-mark result-mark--warning";

      if (trangThaiPhien === "PAID") {
        phanTuBieuTuong = <CircleCheck className="icon icon--lg" />;
        lopDauTrangThai = "result-mark";
      }

      if (trangThaiPhien === "FAILED") {
        phanTuBieuTuong = <XCircle className="icon icon--lg" />;
        lopDauTrangThai = "result-mark result-mark--danger";
      }

      if (trangThaiPhien === "EXPIRED") {
        phanTuBieuTuong = <CircleAlert className="icon icon--lg" />;
        lopDauTrangThai = "result-mark result-mark--danger";
      }

      // Mảng này lưu các dòng đơn hàng trong phiên.
      const cacDonHang = [];

      // Tạo từng dòng đơn hàng từ dữ liệu backend trả về.
      for (const donHang of danhSachDonHang) {
        cacDonHang.push(
          <li className="result-order" key={donHang.orderId}>
            <div className="result-order__main">
              <strong>Đơn #{donHang.orderId}</strong>
            </div>
            <span className="result-order__status">
              {layNhanTrangThaiDonHang(donHang.status)}
            </span>
            <span className="result-order__count">
              {donHang.itemCount} sản phẩm
            </span>
            <strong className="result-order__price">
              {dinhDangTien(donHang.totalMinor)}
            </strong>
          </li>,
        );
      }

      // Phần tử này hiển thị danh sách đơn hàng hoặc thông báo rỗng.
      let phanTuDanhSachDonHang = (
        <p className="muted">Chưa có đơn hàng nào trong phiên này.</p>
      );

      if (cacDonHang.length > 0) {
        phanTuDanhSachDonHang = (
          <ul className="result-orders">{cacDonHang}</ul>
        );
      }

      // Nhãn của nút thanh toán lại phụ thuộc vào trạng thái đang xử lý.
      let nhanNutThanhToan = "Thanh toán " + nhanPhuongThuc;

      if (dangTaoThanhToan === true) {
        nhanNutThanhToan = "Đang tạo giao dịch…";
      }

      // Phần tử này hiển thị khối thanh toán lại khi phiên còn khả dụng.
      let phanTuThanhToan = null;

      if (coTheThanhToan === true) {
        phanTuThanhToan = (
          <div className="result-pay">
            <div>
              <strong>Hoàn tất thanh toán qua {nhanPhuongThuc}</strong>
              <p>
                Bạn sẽ được chuyển sang cổng thanh toán. Đơn hàng chỉ được xác
                nhận sau khi giao dịch thành công.
              </p>
            </div>
            <button
              className="btn btn--primary"
              type="button"
              onClick={xuLyThanhToanLai}
              disabled={dangTaoThanhToan}
            >
              <CreditCard className="icon icon--sm" /> {nhanNutThanhToan}
            </button>
          </div>
        );
      }

      // Đơn COD chỉ cần thông báo thanh toán khi nhận hàng, không mở cổng.
      if (laThanhToanKhiNhanHang === true) {
        if (trangThaiPhien === "PENDING") {
          phanTuThanhToan = (
            <div className="result-pay">
              <div>
                <strong>Thanh toán khi nhận hàng</strong>
                <p>
                  Bạn thanh toán bằng tiền mặt cho nhân viên giao hàng khi nhận
                  được hàng. Không cần thanh toán trực tuyến.
                </p>
              </div>
            </div>
          );
        }
      }

      // Phần tử này hiển thị lỗi tạo giao dịch thanh toán nếu có.
      let phanTuLoiThanhToan = null;

      if (loiThanhToan !== "") {
        phanTuLoiThanhToan = (
          <div className="alert alert--danger result-error" role="alert">
            <CircleAlert className="icon icon--sm" />
            <div>{loiThanhToan}</div>
          </div>
        );
      }

      noiDungChinh = (
        <div className="result-card result-card--wide">
          <div className={lopDauTrangThai}>{phanTuBieuTuong}</div>
          <h1>{thongTinTrangThai.tieuDe}</h1>
          <p>{thongTinTrangThai.moTa}</p>

          <div className="result-rows">
            <div>
              <span>Mã phiên thanh toán</span>
              <strong>#{duLieuKetQua.checkoutSessionId}</strong>
            </div>
            <div>
              <span>Tổng thanh toán</span>
              <strong>{dinhDangTien(duLieuKetQua.totalAmountMinor)}</strong>
            </div>
            <div>
              <span>Phương thức</span>
              <strong>{nhanPhuongThuc}</strong>
            </div>
            <div>
              <span>Trạng thái thanh toán</span>
              <span>{nhanTrangThaiThanhToan}</span>
            </div>
            <div>
              <span>Số đơn hàng</span>
              <span>{danhSachDonHang.length}</span>
            </div>
          </div>

          {phanTuThanhToan}
          {phanTuLoiThanhToan}

          <h2 className="result-subtitle">Đơn hàng trong phiên</h2>
          {phanTuDanhSachDonHang}

          <div className="btn-row">
            <Link className="btn btn--primary" to="/orders">
              Xem đơn hàng
            </Link>
            <Link className="btn" to="/products">
              Tiếp tục mua sắm
            </Link>
            <Link className="btn" to="/cart">
              Về giỏ hàng
            </Link>
          </div>
        </div>
      );
    }
  }

  return <div className="container result-wrap">{noiDungChinh}</div>;
}
