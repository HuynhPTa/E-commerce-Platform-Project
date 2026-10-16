import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Search, ShoppingCart, ChevronDown, User, MapPin, Store, ShieldCheck, LogOut,
} from "lucide-react";
import { useMe, hasToken } from "../../queries/useMe";
import { useMyShop } from "../../queries/useShops";
import { useLogout } from "../../queries/useAuth";
import { useCategoryTree } from "../../queries/useCategories";
import { fetchCart } from "../../api/cart.api";
import CategoryDropdown from "../category/CategoryDropdown";
import { initials } from "../../lib/user";

function UserMenu({ me }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const { data: shop } = useMyShop();
  const logout = useLogout();
  const navigate = useNavigate();

  // đóng menu khi bấm ra ngoài
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const go = () => setOpen(false);
  const sellerLink = shop?.status === "APPROVED"
    ? { to: "/seller", label: "Kênh người bán" }
    : { to: "/seller/register", label: shop ? "Hồ sơ đăng ký shop" : "Đăng ký bán hàng" };

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen((v) => !v)}>
        <span className="avatar">{initials(me)}</span>
        <span>{me.firstName || me.email}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="dropdown">
          <Link to="/profile" onClick={go}><User size={16} /> Hồ sơ của tôi</Link>
          <Link to="/addresses" onClick={go}><MapPin size={16} /> Địa chỉ nhận hàng</Link>
          <Link to={sellerLink.to} onClick={go}><Store size={16} /> {sellerLink.label}</Link>
          {me.role === "ADMIN" && <Link to="/admin" onClick={go}><ShieldCheck size={16} /> Trang quản trị</Link>}
          <hr />
          <button onClick={() => { logout(); go(); navigate({ to: "/" }); }}><LogOut size={16} /> Đăng xuất</button>
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: me } = useMe();
  const { data: tree = [] } = useCategoryTree();
  // Dùng chung cache ["cart"] với trang giỏ hàng; chỉ gọi khi đã đăng nhập
  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: fetchCart, enabled: hasToken() });
  const cartCount = Array.isArray(cart) ? cart.length : 0;

  function submitSearch(e) {
    e.preventDefault();
    navigate({ to: "/products", search: { q: q.trim() || undefined } });
  }

  return (
    <header className="site-header">
      <div className="container site-header-top">
        <Link to="/" className="site-logo">
          <span className="site-logo-mark"><ShoppingBag size={20} /></span> MarketHub
        </Link>

        <form className="site-search" onSubmit={submitSearch} role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm sản phẩm, thương hiệu và tên shop" />
          <button type="submit" aria-label="Tìm kiếm"><Search size={18} /></button>
        </form>

        <div className="header-actions">
          <Link to="/cart" className="header-icon-btn" aria-label="Giỏ hàng">
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="badge-count">{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>
          {me ? (
            <UserMenu me={me} />
          ) : (
            <div className="row">
              <Link to="/register" className="header-link">Đăng ký</Link>
              <span style={{ opacity: 0.6 }}>|</span>
              <Link to="/login" className="header-link">Đăng nhập</Link>
            </div>
          )}
        </div>
      </div>

      <div className="container site-nav">
        <CategoryDropdown />
        {tree.slice(0, 6).map((c) => (
          <Link key={c.id} to="/products" search={{ category: c.slug }}>{c.name}</Link>
        ))}
        <span className="spacer" />
        <Link to="/seller/register">Kênh người bán</Link>
      </div>
    </header>
  );
}
