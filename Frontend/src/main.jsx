import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UngDungCuaHang from "./App.jsx";
import { SU_KIEN_THAY_DOI_DANG_NHAP } from "./lib/authStorage.js";
import "./styles.css";

// QueryClient là bộ quản lý dữ liệu truy vấn dùng chung cho toàn ứng dụng.
const boQuanLyTruyVan = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Khi đăng nhập/đăng xuất hoặc token hết hạn, xoá toàn bộ dữ liệu đã cache.
// Nhờ vậy hồ sơ, địa chỉ, đơn hàng và giỏ hàng của tài khoản cũ không bị dùng lại.
function xuLyThayDoiPhienDangNhap() {
  boQuanLyTruyVan.clear();
}

window.addEventListener(SU_KIEN_THAY_DOI_DANG_NHAP, xuLyThayDoiPhienDangNhap);

// Phần tử gốc là nơi React gắn toàn bộ giao diện vào trang HTML.
const phanTuGoc = document.getElementById("root");

// createRoot tạo bộ điều khiển React cho phần tử gốc.
const boDieuKhienGoc = createRoot(phanTuGoc);

// StrictMode giúp phát hiện một số lỗi tiềm ẩn trong quá trình phát triển.
// QueryClientProvider cung cấp bộ quản lý truy vấn cho mọi thành phần con.
// BrowserRouter cung cấp khả năng điều hướng theo đường dẫn của trình duyệt.
boDieuKhienGoc.render(
  <StrictMode>
    <QueryClientProvider client={boQuanLyTruyVan}>
      <BrowserRouter>
        <UngDungCuaHang />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
