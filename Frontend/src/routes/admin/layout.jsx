import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, FolderTree, Store, ClipboardList, Users, ShieldX, LoaderCircle } from "lucide-react";
import PanelLayout from "../../components/layout/PanelLayout";
import { useMe } from "../../queries/useMe";

const NAV = [
  { section: "Quản trị" },
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { to: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { to: "/admin/shops", label: "Duyệt shop", icon: Store },
  { section: "Khác" },
  { label: "Đơn hàng toàn sàn", icon: ClipboardList, soon: true },
  { label: "Người dùng", icon: Users, soon: true },
];

const TITLES = { "/admin": "Tổng quan", "/admin/categories": "Quản lý danh mục", "/admin/shops": "Phê duyệt shop" };

// Lớp bảo vệ ở FE chỉ để trải nghiệm tốt hơn; quyền thật do @PreAuthorize ở Backend kiểm tra
export default function AdminLayout() {
  const { data: me, isLoading } = useMe();
  const { pathname } = useLocation();

  if (isLoading) return <div className="center-box"><LoaderCircle className="spin" /> Đang kiểm tra quyền…</div>;

  if (me?.role !== "ADMIN") {
    return (
      <div className="center-box" style={{ minHeight: "100vh" }}>
        <ShieldX size={56} color="var(--danger)" />
        <h1 style={{ color: "var(--text)" }}>403 — Không có quyền truy cập</h1>
        <p>Trang này chỉ dành cho quản trị viên.</p>
        <Link to="/" className="btn btn-primary">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <PanelLayout brand="MarketHub" subtitle="Trang quản trị" nav={NAV}
                 title={TITLES[pathname.replace(/\/$/, "")] ?? "Quản trị"} />
  );
}
