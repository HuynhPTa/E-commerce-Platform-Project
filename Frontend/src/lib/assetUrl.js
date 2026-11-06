// Biến này lưu địa chỉ máy chủ backend, ưu tiên giá trị trong biến môi trường.
let DIA_CHI_MAY_CHU_BACKEND = "http://localhost:8080/api";
const DIA_CHI_TU_BIEN_MOI_TRUONG = import.meta.env.VITE_API_BASE_URL;

// Nếu biến môi trường có giá trị hợp lệ thì dùng giá trị đó.
if (DIA_CHI_TU_BIEN_MOI_TRUONG !== undefined) {
  if (DIA_CHI_TU_BIEN_MOI_TRUONG !== null) {
    if (DIA_CHI_TU_BIEN_MOI_TRUONG !== "") {
      DIA_CHI_MAY_CHU_BACKEND = DIA_CHI_TU_BIEN_MOI_TRUONG;
    }
  }
}

// Hàm này lấy phần nguồn của địa chỉ backend,
// dùng để ghép với các đường dẫn ảnh tương đối.
// Hàm trả về chuỗi nguồn hoặc chuỗi rỗng nếu địa chỉ không hợp lệ.
function layNguonMayChuBackend() {
  try {
    const diaChiDayDu = new URL(
      DIA_CHI_MAY_CHU_BACKEND,
      window.location.origin,
    );
    return diaChiDayDu.origin;
  } catch {
    return "";
  }
}

// Biến này lưu nguồn máy chủ backend đã được tách sẵn.
const NGUON_MAY_CHU_BACKEND = layNguonMayChuBackend();

// Hàm này nhận vào đường dẫn tài nguyên,
// trả về đường dẫn đầy đủ để trình duyệt tải đúng máy chủ.
export function taoDuongDanTaiNguyen(diaChiTaiNguyen) {
  // Nếu không có đường dẫn thì trả về null.
  if (diaChiTaiNguyen === undefined) {
    return null;
  }

  if (diaChiTaiNguyen === null) {
    return null;
  }

  if (diaChiTaiNguyen === "") {
    return null;
  }

  // Biến này cho biết đường dẫn đã là địa chỉ tuyệt đối hay chưa.
  const laDiaChiTuyetDoi = /^(https?:)?\/\//i.test(diaChiTaiNguyen);

  // Nếu đã là địa chỉ tuyệt đối thì giữ nguyên.
  if (laDiaChiTuyetDoi === true) {
    return diaChiTaiNguyen;
  }

  // Nếu là dữ liệu ảnh trực tiếp thì giữ nguyên.
  if (diaChiTaiNguyen.startsWith("data:") === true) {
    return diaChiTaiNguyen;
  }

  // Nếu là dữ liệu tạm trong trình duyệt thì giữ nguyên.
  if (diaChiTaiNguyen.startsWith("blob:") === true) {
    return diaChiTaiNguyen;
  }

  // Nếu là đường dẫn tương đối bắt đầu bằng dấu gạch chéo thì ghép nguồn backend.
  if (diaChiTaiNguyen.startsWith("/") === true) {
    return NGUON_MAY_CHU_BACKEND + diaChiTaiNguyen;
  }

  return diaChiTaiNguyen;
}
