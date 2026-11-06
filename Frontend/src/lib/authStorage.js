// Hai khoá này lưu token và thông tin người dùng trong trình duyệt.
const KHOA_TOKEN = "access_token";
const KHOA_NGUOI_DUNG = "auth_user";

// Sự kiện này giúp header và các thành phần khác biết phiên đăng nhập vừa thay đổi.
export const SU_KIEN_THAY_DOI_DANG_NHAP = "markethub:auth-changed";

// Hàm này phát sự kiện sau khi lưu hoặc xoá phiên đăng nhập.
function phatSuKienThayDoiDangNhap() {
  if (typeof window === "undefined") {
    return;
  }

  const suKien = new Event(SU_KIEN_THAY_DOI_DANG_NHAP);
  window.dispatchEvent(suKien);
}

// Hàm này đọc token đang lưu trong trình duyệt.
export function docTokenDangNhap() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem(KHOA_TOKEN);

  if (token === undefined) {
    return null;
  }

  if (token === null) {
    return null;
  }

  if (token === "undefined") {
    return null;
  }

  if (token === "") {
    return null;
  }

  return token;
}

// Hàm này cho biết trình duyệt đang có token đăng nhập hay không.
export function laDaDangNhap() {
  const token = docTokenDangNhap();

  if (token === null) {
    return false;
  }

  return true;
}

// Hàm này đọc thông tin người dùng đã lưu trong trình duyệt.
export function docNguoiDungDangNhap() {
  if (typeof window === "undefined") {
    return null;
  }

  const duLieuTho = localStorage.getItem(KHOA_NGUOI_DUNG);

  if (duLieuTho === null) {
    return null;
  }

  try {
    const duLieu = JSON.parse(duLieuTho);

    if (duLieu === null) {
      return null;
    }

    if (typeof duLieu !== "object") {
      return null;
    }

    return duLieu;
  } catch {
    return null;
  }
}

// Hàm này lưu token và thông tin người dùng sau khi đăng nhập thành công.
export function luuPhienDangNhap(token, nguoiDung) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(KHOA_TOKEN, token);

  if (nguoiDung !== null) {
    if (typeof nguoiDung === "object") {
      const duLieuNguoiDung = JSON.stringify(nguoiDung);
      localStorage.setItem(KHOA_NGUOI_DUNG, duLieuNguoiDung);
    }
  }

  phatSuKienThayDoiDangNhap();
}

// Hàm này xoá toàn bộ dấu vết của phiên đăng nhập hiện tại.
export function xoaPhienDangNhap() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(KHOA_TOKEN);
  localStorage.removeItem(KHOA_NGUOI_DUNG);

  phatSuKienThayDoiDangNhap();
}
