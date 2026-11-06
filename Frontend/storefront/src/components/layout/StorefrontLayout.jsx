import { Outlet } from "react-router-dom";
import ThanhThongBao from "./AnnouncementBar.jsx";
import DauTrangCuaHang from "./StorefrontHeader.jsx";
import ChanTrangCuaHang from "./StorefrontFooter.jsx";

// Outlet là vị trí mà React Router dùng để hiển thị trang con
// tương ứng với đường dẫn hiện tại.
// Thành phần này ghép dải thông báo, đầu trang, nội dung trang và chân trang.
export default function KhungCuaHang() {
  return (
    <div className="storefront-app">
      <ThanhThongBao />
      <DauTrangCuaHang />
      <main className="app-main">
        <Outlet />
      </main>
      <ChanTrangCuaHang />
    </div>
  );
}
