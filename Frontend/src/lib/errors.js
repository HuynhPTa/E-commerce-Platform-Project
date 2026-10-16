// Lấy thông báo lỗi tiếng Việt từ ApiResponse của Backend ({ code, message })
export function errMsg(error, fallback = "Thao tác thất bại, vui lòng thử lại") {
  if (!error) return "";
  if (!error.response) return "Không kết nối được máy chủ";
  if (error.response.status === 403) return "Bạn không có quyền thực hiện thao tác này";
  return error.response.data?.message ?? fallback;
}

export const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");
