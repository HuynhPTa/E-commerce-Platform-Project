import { Navigate, Route, Routes } from "react-router-dom";
import KhungCuaHang from "./components/layout/StorefrontLayout.jsx";
import KhungQuanTri from "./components/layout/AdminLayout.jsx";
import TrangTongQuanQuanTri from "./pages/admin/AdminDashboardPage.jsx";
import TrangDanhMucQuanTri from "./pages/admin/AdminCategoriesPage.jsx";
import TrangSanPhamQuanTri from "./pages/admin/AdminProductsPage.jsx";
import TrangThemSanPhamQuanTri from "./pages/admin/AdminProductNewPage.jsx";
import TrangChiTietSanPhamQuanTri from "./pages/admin/AdminProductDetailPage.jsx";
import TrangDonHangQuanTri from "./pages/admin/AdminOrdersPage.jsx";
import TrangNguoiDungQuanTri from "./pages/admin/AdminUsersPage.jsx";
import TrangDanhSachSanPham from "./pages/ProductListPage.jsx";
import TrangChiTietSanPham from "./pages/ProductDetailPage.jsx";
import TrangDangNhap from "./pages/LoginPage.jsx";
import TrangDangKy from "./pages/RegisterPage.jsx";
import TrangOAuth2Redirect from "./pages/OAuth2RedirectPage.jsx";
import TrangGioHang from "./pages/CartPage.jsx";
import TrangThanhToan from "./pages/CheckoutPage.jsx";
import TrangKetQuaThanhToan from "./pages/CheckoutResultPage.jsx";
import TrangDonHang from "./pages/OrdersPage.jsx";
import TrangChiTietDonHang from "./pages/OrderDetailPage.jsx";
import TrangTaiKhoan from "./pages/AccountPage.jsx";
import TrangKhongTimThay from "./pages/NotFoundPage.jsx";

// Thành phần này khai báo các đường dẫn của cửa hàng.
// Mọi trang con đều được hiển thị bên trong khung chung của cửa hàng.
export default function UngDungCuaHang() {
  return (
    <Routes>
      <Route path="/admin" element={<KhungQuanTri />}>
        <Route index element={<TrangTongQuanQuanTri />} />
        <Route path="categories" element={<TrangDanhMucQuanTri />} />
        <Route path="products" element={<TrangSanPhamQuanTri />} />
        <Route path="products/new" element={<TrangThemSanPhamQuanTri />} />
        <Route
          path="products/:productId"
          element={<TrangChiTietSanPhamQuanTri />}
        />
        <Route path="orders" element={<TrangDonHangQuanTri />} />
        <Route path="users" element={<TrangNguoiDungQuanTri />} />
      </Route>

      <Route element={<KhungCuaHang />}>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<TrangDanhSachSanPham />} />
        <Route path="/products/:productId" element={<TrangChiTietSanPham />} />
        <Route path="/login" element={<TrangDangNhap />} />
        <Route path="/register" element={<TrangDangKy />} />
        <Route path="/oauth2/redirect" element={<TrangOAuth2Redirect />} />
        <Route path="/cart" element={<TrangGioHang />} />
        <Route path="/checkout" element={<TrangThanhToan />} />
        <Route
          path="/checkout/result"
          element={<TrangKetQuaThanhToan />}
        />
        <Route path="/orders" element={<TrangDonHang />} />
        <Route path="/orders/:orderId" element={<TrangChiTietDonHang />} />
        <Route path="/account" element={<TrangTaiKhoan />} />
        <Route path="*" element={<TrangKhongTimThay />} />
      </Route>
    </Routes>
  );
}
