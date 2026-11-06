import axios from "axios";
import { xoaPhienDangNhap } from "../lib/authStorage.js";

// Hai danh sách này lưu các địa chỉ API công khai, không cần gửi token.
const CAC_DIEM_CUOI_CONG_KHAI = ["/auth/login", "/auth/register"];
const CAC_DIEM_CUOI_DOC_CONG_KHAI = ["/products", "/categories"];
// Các nhánh đọc công khai nhưng vẫn cần token quản trị.
const CAC_DIEM_CUOI_DOC_CAN_TOKEN = ["/categories/stats"];

// Hàm này nhận vào một token, kiểm tra token có tồn tại và có phải chuỗi rỗng hay không.
// Hàm trả về true nếu token dùng được, ngược lại trả về false.
function kiemTraTokenHopLe(token) {
  if (token === undefined) {
    return false;
  }

  if (token === null) {
    return false;
  }

  if (token === "undefined") {
    return false;
  }

  if (token === "") {
    return false;
  }

  return true;
}

// Hàm này nhận vào địa chỉ API và phương thức HTTP,
// kiểm tra yêu cầu có thuộc nhóm công khai hay không.
// Hàm trả về true nếu không cần gửi token, ngược lại trả về false.
function kiemTraDiemCuoiCongKhai(diaChiApi, phuongThuc) {
  if (diaChiApi === undefined) {
    return false;
  }

  if (diaChiApi === null) {
    return false;
  }

  for (const diemCuoi of CAC_DIEM_CUOI_CONG_KHAI) {
    if (diaChiApi.startsWith(diemCuoi) === true) {
      return true;
    }
  }

  // Chỉ các yêu cầu đọc mới được coi là công khai ở nhóm điểm cuối này.
  let phuongThucChuanHoa = phuongThuc;

  if (typeof phuongThucChuanHoa === "string") {
    phuongThucChuanHoa = phuongThucChuanHoa.toUpperCase();
  }

  if (phuongThucChuanHoa === "GET") {
    for (const diemCuoi of CAC_DIEM_CUOI_DOC_CAN_TOKEN) {
      if (diaChiApi.startsWith(diemCuoi) === true) {
        return false;
      }
    }

    for (const diemCuoi of CAC_DIEM_CUOI_DOC_CONG_KHAI) {
      if (diaChiApi.startsWith(diemCuoi) === true) {
        return true;
      }
    }
  }

  if (phuongThucChuanHoa === "HEAD") {
    for (const diemCuoi of CAC_DIEM_CUOI_DOC_CAN_TOKEN) {
      if (diaChiApi.startsWith(diemCuoi) === true) {
        return false;
      }
    }

    for (const diemCuoi of CAC_DIEM_CUOI_DOC_CONG_KHAI) {
      if (diaChiApi.startsWith(diemCuoi) === true) {
        return true;
      }
    }
  }

  return false;
}

// Biến này lưu địa chỉ máy chủ backend, ưu tiên giá trị trong biến môi trường.
let diaChiMayChuBackend = "http://localhost:8080/api";
const diaChiTuBienMoiTruong = import.meta.env.VITE_API_BASE_URL;

// Nếu biến môi trường có giá trị hợp lệ thì dùng giá trị đó.
if (diaChiTuBienMoiTruong !== undefined) {
  if (diaChiTuBienMoiTruong !== null) {
    if (diaChiTuBienMoiTruong !== "") {
      diaChiMayChuBackend = diaChiTuBienMoiTruong;
    }
  }
}

// Biến này là bộ gọi API dùng chung cho toàn bộ trang cửa hàng.
export const boGoiApi = axios.create({
  baseURL: diaChiMayChuBackend,
});

// Hàm này nhận vào cấu hình của một yêu cầu HTTP,
// thêm token vào tiêu đề nếu địa chỉ API không thuộc nhóm công khai.
// Hàm trả về cấu hình yêu cầu sau khi đã xử lý.
function xuLyCauHinhYeuCau(cauHinhYeuCau) {
  // Biến này lưu token đăng nhập đang được lưu trong trình duyệt.
  const accessToken = localStorage.getItem("access_token");

  // Biến này cho biết token hiện tại có dùng được hay không.
  const coTokenHopLe = kiemTraTokenHopLe(accessToken);

  // Nếu có token hợp lệ thì kiểm tra tiếp địa chỉ API có cần gửi token không.
  if (coTokenHopLe === true) {
    const laDiemCuoiCongKhai = kiemTraDiemCuoiCongKhai(
      cauHinhYeuCau.url,
      cauHinhYeuCau.method,
    );

    if (laDiemCuoiCongKhai === false) {
      cauHinhYeuCau.headers.Authorization = "Bearer " + accessToken;
    }
  }

  return cauHinhYeuCau;
}

// Hàm này nhận vào phản hồi thành công của backend và trả lại nguyên vẹn phản hồi.
function xuLyPhanHoiThanhCong(phanHoi) {
  return phanHoi;
}

// Hàm này nhận vào lỗi của yêu cầu HTTP,
// xoá token nếu backend báo phiên đăng nhập đã hết hạn.
// Hàm trả về một lời hứa bị từ chối để thành phần gọi xử lý tiếp.
function xuLyPhanHoiLoi(loi) {
  // Biến này lưu mã trạng thái HTTP do backend trả về.
  let maTrangThai = undefined;

  // Nếu lỗi có kèm phản hồi từ backend thì mới đọc mã trạng thái.
  if (loi.response !== undefined) {
    // Tiếp tục kiểm tra null trước khi truy cập thuộc tính.
    if (loi.response !== null) {
      maTrangThai = loi.response.status;
    }
  }

  // Nếu mã trạng thái là 401 thì xoá toàn bộ phiên đã hết hạn.
  // Hàm xoá đồng thời phát sự kiện để QueryClient bỏ dữ liệu cache của tài khoản cũ.
  if (maTrangThai === 401) {
    xoaPhienDangNhap();
  }

  return Promise.reject(loi);
}

// Gắn hai hàm xử lý vào bộ gọi API để mọi yêu cầu đều đi qua cùng một nơi.
boGoiApi.interceptors.request.use(xuLyCauHinhYeuCau);
boGoiApi.interceptors.response.use(
  xuLyPhanHoiThanhCong,
  xuLyPhanHoiLoi,
);
