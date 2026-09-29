import { Outlet, Link, useLocation } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

export default function RootLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header>
        <Link to="/">Trang chủ</Link>
        <Link to="/products">Sản phẩm</Link>
        <Link to="/cart">Giỏ hàng</Link>
      </header>
      <main>
        {/* Suspense: fallback trong lúc bundle lazy-load (đặc biệt seller/admin) tải về */}
        {/* ErrorBoundary: lỗi 1 route không kéo sập cả app; key theo path để reset khi đổi route */}
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<p>Đang tải trang…</p>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer>© Sàn TMĐT</footer>
    </div>
  );
}
