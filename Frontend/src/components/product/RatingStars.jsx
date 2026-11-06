// Đường dẫn vẽ hình ngôi sao, dùng chung cho lớp nền và lớp tô màu.
const duongDanBieuTuongNgoiSao =
  "M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 17.6 6.1 20.8l1.2-6.6L2.5 9.5l6.6-.9z";

// Tổng số ngôi sao cần hiển thị cho mỗi điểm đánh giá.
const soNgoiSaoToiDa = 5;

// Hàm này nhận vào chỉ số ngôi sao và điểm đánh giá,
// tính phần trăm cần tô rồi trả về một phần tử ngôi sao hoàn chỉnh.
function taoPhanTuNgoiSao(chiSoNgoiSao, diemDanhGia) {
  // Biến này lưu phần điểm còn lại sau khi đã trừ các ngôi sao đứng trước.
  const phanDiemConLai = diemDanhGia - chiSoNgoiSao;

  // Biến này lưu phần trăm ngôi sao hiện tại được tô màu.
  let phanTramTo;

  // Nếu phần điểm còn lại từ 1 trở lên thì tô đầy ngôi sao.
  if (phanDiemConLai >= 1) {
    phanTramTo = 100;
  } else {
    // Trường hợp phần điểm còn lại nhỏ hơn 1:
    // kiểm tra xem còn phần lẻ để tô một phần hay không.
    if (phanDiemConLai > 0) {
      phanTramTo = phanDiemConLai * 100;
    } else {
      // Nếu không còn điểm thì giữ nguyên ngôi sao rỗng.
      phanTramTo = 0;
    }
  }

  // Biến này lưu chiều rộng của lớp phủ màu vàng.
  const chieuRongPhanTo = phanTramTo + "%";

  // Biến này lưu kiểu hiển thị cho lớp phủ màu vàng.
  const kieuPhanTo = { width: chieuRongPhanTo };

  // Trả về một ngôi sao gồm lớp nền xám và lớp phủ màu vàng.
  return (
    <span className="stars__item" key={chiSoNgoiSao}>
      <svg
        className="icon stars__base"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d={duongDanBieuTuongNgoiSao} />
      </svg>

      <span className="stars__fill" style={kieuPhanTo}>
        <svg
          className="icon stars__fill-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d={duongDanBieuTuongNgoiSao} />
        </svg>
      </span>
    </span>
  );
}

// Hàm này nhận vào tham số thuocTinh, tức là props —
// dữ liệu mà thành phần cha truyền xuống thành phần con.
// Hàm lấy điểm đánh giá rồi trả về phần tử hiển thị năm ngôi sao.
export default function HienThiSaoDanhGia(thuocTinh) {
  // Biến này lưu điểm đánh giá ban đầu, mặc định là 0.
  let diemDanhGia = 0;

  // Nếu thành phần cha có truyền thuộc tính rating thì mới đọc giá trị.
  if (thuocTinh.rating !== undefined) {
    // Tiếp tục kiểm tra giá trị null để tránh chuyển đổi sai.
    if (thuocTinh.rating !== null) {
      diemDanhGia = Number(thuocTinh.rating);
    }
  }

  // Nếu giá trị không phải là số hữu hạn thì quay về 0.
  if (Number.isFinite(diemDanhGia) === false) {
    diemDanhGia = 0;
  }

  // Biến này lưu tên lớp bao ngoài của cụm sao.
  let tenLopBaoNgoai = "stars";

  // Nếu điểm đánh giá không lớn hơn 0 thì thêm lớp báo trạng thái rỗng.
  if (diemDanhGia <= 0) {
    tenLopBaoNgoai = "stars stars--empty";
  }

  // Mảng này lưu các phần tử ngôi sao trước khi đưa vào giao diện.
  const mangNgoiSao = [];

  // Biến này lưu chỉ số của ngôi sao đang được tạo, bắt đầu từ 0.
  let chiSoNgoiSao = 0;

  // Lặp cho tới khi tạo đủ số ngôi sao cần hiển thị.
  while (chiSoNgoiSao < soNgoiSaoToiDa) {
    // Tạo một ngôi sao dựa trên chỉ số và điểm đánh giá hiện tại.
    const phanTuNgoiSao = taoPhanTuNgoiSao(chiSoNgoiSao, diemDanhGia);

    // Thêm ngôi sao vừa tạo vào mảng để hiển thị sau đó.
    mangNgoiSao.push(phanTuNgoiSao);

    // Tăng chỉ số để chuyển sang ngôi sao tiếp theo.
    chiSoNgoiSao += 1;
  }

  // Trả về cụm năm ngôi sao đã được tạo.
  return (
    <span className={tenLopBaoNgoai} aria-hidden="true">
      {mangNgoiSao}
    </span>
  );
}
