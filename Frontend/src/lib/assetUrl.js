// Ảnh upload được lưu trong DB dưới dạng đường dẫn tương đối (/uploads/...).
// Trình duyệt sẽ tải nhầm từ origin của frontend (Vite) nếu không trỏ về backend.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
})();

export function assetUrl(url) {
  if (!url) return null;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return url.startsWith("/") ? `${API_ORIGIN}${url}` : url;
}

// Ảnh thay thế khi file upload không còn trên máy chủ (tránh icon ảnh vỡ của trình duyệt).
export const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">' +
      '<rect width="160" height="160" fill="#f2f2f4"/>' +
      '<path d="M48 58h64a6 6 0 0 1 6 6v38a6 6 0 0 1-6 6H48a6 6 0 0 1-6-6V64a6 6 0 0 1 6-6Z" fill="none" stroke="#c4c4cc" stroke-width="6"/>' +
      '<circle cx="66" cy="76" r="7" fill="#c4c4cc"/>' +
      '<path d="m46 104 22-22 14 14 10-10 24 24" fill="none" stroke="#c4c4cc" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>",
  );

export function onImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_IMAGE;
}
