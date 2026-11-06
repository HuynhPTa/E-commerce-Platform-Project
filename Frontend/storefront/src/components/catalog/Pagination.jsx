import { ArrowLeft, ArrowRight } from "lucide-react";

// Hàm này so sánh hai số trang để dùng cho việc sắp xếp tăng dần.
function soSanhSoTrang(soTrangThuNhat, soTrangThuHai) {
  return soTrangThuNhat - soTrangThuHai;
}

// Hàm này tạo danh sách các mục cần hiển thị trên thanh phân trang.
// Khi có nhiều trang, danh sách sẽ có thêm dấu ba chấm ở giữa các nhóm trang.
function taoDanhSachPhanTrang(trangHienTai, tongSoTrang) {
  // Nếu tổng số trang nhỏ thì hiển thị đủ tất cả các trang.
  if (tongSoTrang <= 7) {
    const cacTrangDayDu = [];

    // Biến này lưu số trang đang được thêm vào danh sách.
    let soTrang = 1;

    // Thêm lần lượt từng trang cho tới khi đủ tổng số trang.
    while (soTrang <= tongSoTrang) {
      cacTrangDayDu.push(soTrang);
      soTrang += 1;
    }

    return cacTrangDayDu;
  }

  // Set là tập hợp các giá trị không trùng nhau.
  const cacTrangNhinThay = new Set();

  // Luôn hiển thị trang đầu, trang cuối và các trang gần trang hiện tại.
  cacTrangNhinThay.add(1);
  cacTrangNhinThay.add(tongSoTrang);
  cacTrangNhinThay.add(trangHienTai - 1);
  cacTrangNhinThay.add(trangHienTai);
  cacTrangNhinThay.add(trangHienTai + 1);

  // Nếu đang ở gần đầu danh sách thì hiển thị thêm vài trang đầu.
  if (trangHienTai <= 3) {
    cacTrangNhinThay.add(2);
    cacTrangNhinThay.add(3);
    cacTrangNhinThay.add(4);
  }

  // Nếu đang ở gần cuối danh sách thì hiển thị thêm vài trang cuối.
  if (trangHienTai >= tongSoTrang - 2) {
    cacTrangNhinThay.add(tongSoTrang - 1);
    cacTrangNhinThay.add(tongSoTrang - 2);
    cacTrangNhinThay.add(tongSoTrang - 3);
  }

  // Mảng này lưu các trang hợp lệ sau khi lọc.
  const cacTrangHopLe = [];

  // Chỉ giữ lại các trang nằm trong khoảng từ 1 tới tổng số trang.
  for (const soTrang of cacTrangNhinThay) {
    let hopLe = true;

    if (soTrang < 1) {
      hopLe = false;
    }

    if (soTrang > tongSoTrang) {
      hopLe = false;
    }

    if (hopLe === true) {
      cacTrangHopLe.push(soTrang);
    }
  }

  cacTrangHopLe.sort(soSanhSoTrang);

  // Mảng này lưu các mục phân trang cuối cùng.
  const cacPhanTrang = [];

  // Biến này lưu vị trí của trang đang xử lý.
  let chiSoTrang = 0;

  // Duyệt từng trang để chèn dấu ba chấm khi có khoảng trống.
  while (chiSoTrang < cacTrangHopLe.length) {
    const soTrangHienTai = cacTrangHopLe[chiSoTrang];

    // Nếu trang hiện tại cách trang trước đó nhiều hơn một đơn vị thì thêm dấu ba chấm.
    if (chiSoTrang > 0) {
      const soTrangTruoc = cacTrangHopLe[chiSoTrang - 1];

      if (soTrangHienTai - soTrangTruoc > 1) {
        cacPhanTrang.push("ellipsis");
      }
    }

    cacPhanTrang.push(soTrangHienTai);
    chiSoTrang += 1;
  }

  return cacPhanTrang;
}

// Thành phần này hiển thị thanh phân trang cho danh sách sản phẩm.
export default function PhanTrang(thuocTinh) {
  // Nếu chỉ có một trang hoặc không có trang nào thì không cần hiển thị.
  if (thuocTinh.tongSoTrang <= 1) {
    return null;
  }

  // Biến này lưu trang hiện tại.
  const trangHienTai = thuocTinh.trangHienTai;

  // Hàm này gửi số trang mới lên thành phần cha.
  const khiDoiTrang = thuocTinh.khiDoiTrang;

  const cacPhanTrang = taoDanhSachPhanTrang(
    trangHienTai,
    thuocTinh.tongSoTrang,
  );

  // Hàm này chuyển về trang trước.
  function xuLyTrangTruoc() {
    khiDoiTrang(trangHienTai - 1);
  }

  // Hàm này chuyển sang trang sau.
  function xuLyTrangSau() {
    khiDoiTrang(trangHienTai + 1);
  }

  // Phần tử này hiển thị nút trang trước hoặc trạng thái không thể bấm.
  let phanTuTrangTruoc;

  if (trangHienTai > 1) {
    phanTuTrangTruoc = (
      <button
        className="page-btn"
        type="button"
        onClick={xuLyTrangTruoc}
        aria-label="Trang trước"
      >
        <ArrowLeft className="icon icon--sm" />
      </button>
    );
  } else {
    phanTuTrangTruoc = (
      <span className="page-btn" aria-disabled="true">
        <ArrowLeft className="icon icon--sm" />
      </span>
    );
  }

  // Mảng này lưu các nút số trang và dấu ba chấm.
  const cacNutTrang = [];

  // Biến này lưu vị trí của mục phân trang đang xử lý.
  let chiSoPhanTrang = 0;

  // Tạo phần tử giao diện cho từng mục phân trang.
  while (chiSoPhanTrang < cacPhanTrang.length) {
    const phanTrang = cacPhanTrang[chiSoPhanTrang];

    if (phanTrang === "ellipsis") {
      const khoaDauBaCham = "ellipsis-" + chiSoPhanTrang;

      cacNutTrang.push(
        <span className="page-btn" key={khoaDauBaCham}>
          …
        </span>,
      );
    } else {
      const soTrang = phanTrang;

      // Hàm này chuyển tới đúng số trang được chọn.
      function xuLyChonTrang() {
        khiDoiTrang(soTrang);
      }

      // aria-current cho trình đọc màn hình biết trang đang được chọn.
      let giaTriHienTai = undefined;
      if (soTrang === trangHienTai) {
        giaTriHienTai = "page";
      }

      cacNutTrang.push(
        <button
          className="page-btn"
          type="button"
          key={soTrang}
          aria-current={giaTriHienTai}
          onClick={xuLyChonTrang}
        >
          {soTrang}
        </button>,
      );
    }

    chiSoPhanTrang += 1;
  }

  // Phần tử này hiển thị nút trang sau hoặc trạng thái không thể bấm.
  let phanTuTrangSau;

  if (trangHienTai < thuocTinh.tongSoTrang) {
    phanTuTrangSau = (
      <button
        className="page-btn"
        type="button"
        onClick={xuLyTrangSau}
        aria-label="Trang sau"
      >
        <ArrowRight className="icon icon--sm" />
      </button>
    );
  } else {
    phanTuTrangSau = (
      <span className="page-btn" aria-disabled="true">
        <ArrowRight className="icon icon--sm" />
      </span>
    );
  }

  return (
    <nav className="pagination" aria-label="Phân trang">
      {phanTuTrangTruoc}
      {cacNutTrang}
      {phanTuTrangSau}
    </nav>
  );
}
