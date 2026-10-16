import { Suspense } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, ShoppingBag } from "lucide-react";
import { useMe } from "../../queries/useMe";
import { initials, displayName } from "../../lib/user";

// Khung chung cho Admin & Kênh người bán: sidebar tối bên trái + topbar + nội dung (Outlet)
// nav: [{ to, label, icon: Component, exact?, soon? }] hoặc { section: "Tiêu đề nhóm" }
export default function PanelLayout({ brand, subtitle, nav, title }) {
  const { data: me } = useMe();

  return (
    <div className="panel-shell">
      <aside className="panel-sidebar">
        <Link to="/" className="panel-brand">
          <span className="site-logo-mark"><ShoppingBag size={18} /></span>
          <span>{brand}<small>{subtitle}</small></span>
        </Link>
        <nav className="panel-nav">
          {nav.map((item) => {
            if (item.section) return <div key={item.section} className="panel-nav-label">{item.section}</div>;
            const Icon = item.icon;
            if (item.soon) {
              return (
                <span key={item.label} className="disabled" title="Chức năng đang được phát triển">
                  <Icon size={18} /> {item.label} <span className="soon">Sắp có</span>
                </span>
              );
            }
            return (
              <Link key={item.to} to={item.to} params={item.params}
                    activeProps={{ className: "active" }} activeOptions={{ exact: !!item.exact }}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="panel-sidebar-footer">
          <Link to="/"><ArrowLeft size={18} /> Về trang mua sắm</Link>
        </div>
      </aside>

      <div className="panel-main">
        <header className="panel-topbar">
          <h1>{title}</h1>
          {me && (
            <div className="panel-user">
              <span className="avatar">{initials(me)}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{displayName(me)}</div>
                <div className="cell-sub">{me.email}</div>
              </div>
            </div>
          )}
        </header>
        <div className="panel-content">
          <Suspense fallback={<div className="center-box"><LoaderCircle className="spin" /> Đang tải…</div>}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
