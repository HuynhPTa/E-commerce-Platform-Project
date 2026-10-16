import { Outlet, useLocation } from "@tanstack/react-router";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import SiteHeader from "../components/layout/SiteHeader";

// Trang Admin và Kênh người bán có layout sidebar riêng (PanelLayout), không dùng header người mua.
// Riêng /seller/register vẫn là trang của người mua (chưa có shop).
const isPanelPath = (path) =>
  path.startsWith("/admin") || (path.startsWith("/seller") && !path.startsWith("/seller/register"));

const PageLoading = () => (
  <div className="center-box"><LoaderCircle className="spin" /> Đang tải trang…</div>
);

export default function RootLayout() {
  const location = useLocation();

  // ErrorBoundary: lỗi 1 route không kéo sập cả app; key theo path để reset khi đổi route
  // Suspense: fallback trong lúc bundle lazy-load (đặc biệt seller/admin) tải về
  const content = (
    <ErrorBoundary key={location.pathname}>
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );

  if (isPanelPath(location.pathname)) return content;

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="app-main">{content}</main>
      <footer className="site-footer">
        <div className="container">© 2026 MarketHub — Đồ án môn Các công nghệ lập trình hiện đại</div>
      </footer>
    </div>
  );
}
