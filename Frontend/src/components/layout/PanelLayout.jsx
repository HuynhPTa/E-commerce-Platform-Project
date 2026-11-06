import { Suspense, useEffect, useState } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, Menu, ShoppingBag, X } from "lucide-react";
import { useMe } from "../../queries/useMe";
import { initials, displayName } from "../../lib/user";

// Khung chung cho Admin & Kênh người bán: sidebar tối bên trái + topbar + nội dung (Outlet)
// nav: [{ to, label, icon: Component, exact?, soon? }] hoặc { section: "Tiêu đề nhóm" }
export default function PanelLayout({ brand, subtitle, nav, title }) {
  const { data: me } = useMe();
  const [menuOpen, setMenuOpen] = useState(false);

  // Drawer mobile: khoá cuộn nền khi menu đang mở
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="panel-shell">
      {menuOpen && (
        <button className="panel-overlay" type="button" aria-label="Đóng menu" onClick={closeMenu} />
      )}
      <aside className={`panel-sidebar${menuOpen ? " open" : ""}`}>
        <Link to="/" className="panel-brand" onClick={closeMenu}>
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
              <Link key={item.to} to={item.to} params={item.params} onClick={closeMenu}
                    activeProps={{ className: "active" }} activeOptions={{ exact: !!item.exact }}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="panel-sidebar-footer">
          <Link to="/" onClick={closeMenu}><ArrowLeft size={18} /> Về trang mua sắm</Link>
        </div>
      </aside>

      <div className="panel-main">
        <header className="panel-topbar">
          <button className="panel-menu-btn" type="button" onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
