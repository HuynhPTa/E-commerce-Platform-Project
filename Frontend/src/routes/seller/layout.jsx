import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Store, Package, ClipboardList, Settings, LoaderCircle } from "lucide-react";
import PanelLayout from "../../components/layout/PanelLayout";
import { useMyShop } from "../../queries/useShops";
import ShopStatusBadge from "../../components/shop/ShopStatusBadge";

// Chỉ shop đã được Admin duyệt mới vào được Kênh người bán
export default function SellerLayout() {
  const { data: shop, isLoading } = useMyShop();
  const pathname = useLocation({ select: (location) => location.pathname });

  if (isLoading) return <div className="center-box"><LoaderCircle className="spin" /> Đang tải shop…</div>;

  if (!shop || shop.status !== "APPROVED") {
    return (
      <div className="center-box" style={{ minHeight: "100vh" }}>
        <Store size={56} color="var(--primary)" />
        <h1 style={{ color: "var(--text)" }}>{shop ? "Shop chưa sẵn sàng" : "Bạn chưa có shop"}</h1>
        {shop && <p><ShopStatusBadge status={shop.status} /></p>}
        <p>{shop ? "Kênh người bán chỉ mở khi shop đã được Admin duyệt." : "Đăng ký mở shop để bắt đầu bán hàng trên MarketHub."}</p>
        <Link to="/seller/register" className="btn btn-primary">{shop ? "Xem hồ sơ đăng ký" : "Đăng ký mở shop"}</Link>
      </div>
    );
  }

  const nav = [
    { section: "Quản lý shop" },
    { to: "/seller", label: "Tổng quan", icon: LayoutDashboard, exact: true },
    { to: "/shops/$shopId", params: { shopId: String(shop.id) }, label: "Trang shop của tôi", icon: Store },
    { to: "/seller/products", label: "Sản phẩm", icon: Package },
    { to: "/seller/orders", label: "Đơn hàng", icon: ClipboardList },
    { to: "/seller/settings", label: "Cài đặt shop", icon: Settings },
  ];

  const title = pathname === "/seller"
    ? `Tổng quan — ${shop.name}`
    : pathname === "/seller/products"
      ? "Quản lý sản phẩm"
      : pathname === "/seller/products/new"
        ? "Thêm sản phẩm"
        : pathname.startsWith("/seller/products/")
          ? "Chi tiết sản phẩm"
          : pathname === "/seller/orders"
            ? "Quản lý đơn hàng"
            : pathname === "/seller/settings"
              ? "Cài đặt shop"
              : "Kênh người bán";

  return <PanelLayout brand={shop.name} subtitle="Kênh người bán" nav={nav} title={title} />;
}
