import HienThiSaoDanhGia from "./RatingStars.jsx";

// Các mức điểm sao cần thống kê, xếp từ cao xuống thấp.
const CAC_GIA_TRI_SAO = [5, 4, 3, 2, 1];

// Hàm này nhận vào tên người dùng và trả về chữ viết tắt để hiển thị trong ảnh đại diện.
function layChuVietTat(tenNguoiDung) {
  // Nếu tên không phải chuỗi thì trả về chữ viết tắt mặc định.
  if (typeof tenNguoiDung !== "string") {
    return "KH";
  }

  // Biến này lưu tên sau khi bỏ khoảng trắng ở hai đầu.
  const tenDaCat = tenNguoiDung.trim();

  // Nếu tên rỗng thì trả về chữ viết tắt mặc định.
  if (tenDaCat === "") {
    return "KH";
  }

  // Tách tên thành các từ, mỗi từ cách nhau bởi khoảng trắng.
  const mangTen = tenDaCat.split(/\s+/);

  // Nếu chỉ có một từ thì lấy hai ký tự đầu.
  if (mangTen.length === 1) {
    const haiKyTuDau = mangTen[0].slice(0, 2);
    return haiKyTuDau.toLocaleUpperCase("vi");
  }

  // Nếu có nhiều từ thì lấy chữ đầu của từ đầu và từ cuối.
  const tuDauTien = mangTen[0];
  const tuCuoiCung = mangTen[mangTen.length - 1];
  const chuDauTien = tuDauTien.charAt(0);
  const chuCuoiCung = tuCuoiCung.charAt(0);
  const chuVietTat = chuDauTien + chuCuoiCung;

  return chuVietTat.toLocaleUpperCase("vi");
}

// Hàm này nhận vào thời điểm tạo đánh giá và trả về ngày theo định dạng Việt Nam.
function dinhDangNgayDanhGia(thoiDiemTao) {
  // Biến này lưu đối tượng ngày được tạo từ dữ liệu backend.
  const ngayDanhGia = new Date(thoiDiemTao);

  // Nếu ngày không hợp lệ thì trả về chuỗi rỗng.
  if (Number.isNaN(ngayDanhGia.getTime()) === true) {
    return "";
  }

  // Bộ định dạng này chuyển ngày sang cách viết của Việt Nam.
  const boDinhDangNgay = new Intl.DateTimeFormat("vi-VN");

  return boDinhDangNgay.format(ngayDanhGia);
}

// Thành phần này hiển thị phần tổng quan đánh giá và danh sách nhận xét của sản phẩm.
export default function DanhGiaSanPham(thuocTinh) {
  // Biến này lưu điểm đánh giá trung bình của sản phẩm.
  const diemTrungBinh = thuocTinh.diemTrungBinh;

  // Biến này lưu tổng số lượt đánh giá của sản phẩm.
  const soLuongDanhGia = thuocTinh.soLuongDanhGia;

  // Biến này lưu danh sách đánh giá chi tiết.
  const danhSachDanhGia = thuocTinh.danhSachDanhGia;

  // Biến này cho biết đánh giá đang được tải hay không.
  const dangTai = thuocTinh.dangTai;

  // Biến này cho biết việc tải đánh giá có bị lỗi hay không.
  const coLoi = thuocTinh.coLoi;

  // Mảng này lưu số lượt đánh giá tương ứng với từng mức sao.
  const soLuongTheoMoiSao = [];

  // Đếm số lượt đánh giá cho từng mức sao.
  for (const giaTriSao of CAC_GIA_TRI_SAO) {
    let soLuong = 0;

    for (const danhGia of danhSachDanhGia) {
      if (danhGia.rating === giaTriSao) {
        soLuong += 1;
      }
    }

    soLuongTheoMoiSao.push(soLuong);
  }

  // Biến này lưu điểm trung bình đã được định dạng để hiển thị.
  let diemTrungBinhHienThi = "—";

  // Nếu sản phẩm có đánh giá thì hiển thị điểm trung bình một chữ số thập phân.
  if (soLuongDanhGia > 0) {
    const diemSo = Number(diemTrungBinh);
    diemTrungBinhHienThi = diemSo.toFixed(1);
  }

  // Mảng này lưu các thanh thống kê số sao.
  const cacThanhThongKe = [];

  // Biến này lưu vị trí của mức sao đang xét.
  let chiSoSao = 0;

  // Tạo thanh thống kê cho từng mức sao.
  while (chiSoSao < CAC_GIA_TRI_SAO.length) {
    const giaTriSao = CAC_GIA_TRI_SAO[chiSoSao];
    const soLuong = soLuongTheoMoiSao[chiSoSao];

    // Biến này lưu phần trăm độ dài của thanh.
    let phanTram = 0;

    // Nếu có đánh giá thì tính phần trăm theo tổng số đánh giá.
    if (danhSachDanhGia.length > 0) {
      phanTram = (soLuong / danhSachDanhGia.length) * 100;
    }

    const kieuThanh = { width: phanTram + "%" };

    cacThanhThongKe.push(
      <div className="review-bar" key={giaTriSao}>
        <span>{giaTriSao} sao</span>
        <span className="review-bar__track">
          <span className="review-bar__fill" style={kieuThanh} />
        </span>
        <span>{soLuong}</span>
      </div>,
    );

    chiSoSao += 1;
  }

  // Mảng này lưu các thẻ đánh giá chi tiết.
  const cacPhanTuDanhGia = [];

  // Tạo phần tử giao diện cho từng đánh giá.
  for (const danhGia of danhSachDanhGia) {
    // Biến này lưu tên người dùng, mặc định là "Khách hàng".
    let tenNguoiDungHienThi = "Khách hàng";

    // Nếu đánh giá có tên người dùng thì kiểm tra trước khi hiển thị.
    if (danhGia.userName !== undefined) {
      if (danhGia.userName !== null) {
        const tenDaCat = danhGia.userName.trim();

        if (tenDaCat !== "") {
          tenNguoiDungHienThi = danhGia.userName;
        }
      }
    }

    // Biến này lưu nội dung nhận xét, mặc định là thông báo không có nhận xét.
    let noiDungNhanXet = "Người mua không để lại nhận xét.";

    // Nếu đánh giá có nội dung thì dùng nội dung đã bỏ khoảng trắng ở hai đầu.
    if (danhGia.comment !== undefined) {
      if (danhGia.comment !== null) {
        const nhanXetDaCat = danhGia.comment.trim();

        if (nhanXetDaCat !== "") {
          noiDungNhanXet = nhanXetDaCat;
        }
      }
    }

    const chuVietTat = layChuVietTat(danhGia.userName);
    const ngayDanhGia = dinhDangNgayDanhGia(danhGia.createdAt);

    cacPhanTuDanhGia.push(
      <article className="review" key={danhGia.id}>
        <div className="review__head">
          <span className="review__avatar">{chuVietTat}</span>
          <span className="review__name">{tenNguoiDungHienThi}</span>
          <span className="review__date">{ngayDanhGia}</span>
          <HienThiSaoDanhGia rating={danhGia.rating} />
        </div>
        <p>{noiDungNhanXet}</p>
      </article>,
    );
  }

  // Phần tử này hiển thị nội dung trạng thái của phần đánh giá.
  let phanTuTrangThaiDanhGia;

  // Nếu đang tải thì hiển thị thông báo tải.
  if (dangTai === true) {
    phanTuTrangThaiDanhGia = (
      <p className="pdp-desc">Đang tải đánh giá từ MarketHub…</p>
    );
  } else if (coLoi === true) {
    // Nếu tải lỗi thì hiển thị thông báo lỗi.
    phanTuTrangThaiDanhGia = (
      <p className="pdp-desc">Không tải được đánh giá. Vui lòng thử lại.</p>
    );
  } else if (danhSachDanhGia.length === 0) {
    // Nếu chưa có đánh giá thì hiển thị thông báo rỗng.
    phanTuTrangThaiDanhGia = (
      <p className="pdp-desc">Chưa có đánh giá nào cho sản phẩm này.</p>
    );
  } else {
    // Nếu có đánh giá thì hiển thị danh sách nhận xét.
    phanTuTrangThaiDanhGia = (
      <div className="review-list">{cacPhanTuDanhGia}</div>
    );
  }

  return (
    <section className="pdp-section" id="danh-gia">
      <h2>Đánh giá</h2>
      <div>
        <div className="review-summary">
          <div className="review-score">
            <strong>{diemTrungBinhHienThi}</strong>
            <HienThiSaoDanhGia rating={diemTrungBinh} />
            <span className="eyebrow-free">{soLuongDanhGia} đánh giá</span>
          </div>

          <div className="review-bars">{cacThanhThongKe}</div>
        </div>

        {phanTuTrangThaiDanhGia}
      </div>
    </section>
  );
}
