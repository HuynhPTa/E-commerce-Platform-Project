import { createRouter, createRootRoute, createRoute } from "@tanstack/react-router";
import { lazy } from "react";
import RootLayout from "../routes/__root.jsx";
import { productSearchSchema } from "../schemas/product-search.schema";
import { shopProductsSearchSchema } from "../schemas/shop.schema";
import { redirect } from "@tanstack/react-router";
import { hasToken } from "../queries/useMe";
// Tầng 1B — TanStack Router: tổ chức route + route params có validate.
const rootRoute = createRootRoute({ component: RootLayout });

// Trang cần đăng nhập: chưa có token thì chuyển về /login trước khi render
const requireAuth = () => {
  if (!hasToken()) throw redirect({ to: "/login" });
};

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazy(() => import("../routes/index.jsx")),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: lazy(() => import("../routes/login.jsx")),
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: lazy(() => import("../routes/register.jsx")),
});

const productsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  // validateSearch bằng Zod — search params ở URL được parse & type-safe,
  // sai kiểu (vd ?page=abc) sẽ bị chặn/parse về default thay vì crash component.
  validateSearch: productSearchSchema,
  component: lazy(() => import("../routes/products/index.jsx")),
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  component: lazy(() => import("../routes/products/$productId.jsx")),
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: lazy(() => import("../routes/cart.jsx")),
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: lazy(() => import("../routes/checkout.jsx")),
});

// Trang công khai của shop: /shops/12?sort=best_selling&page=2
const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shops/$shopId",
  validateSearch: shopProductsSearchSchema,
  component: lazy(() => import("../routes/shops/$shopId.jsx")),
});

// Form đăng ký mở shop — dùng layout người mua (người dùng chưa có shop)
const sellerRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/seller/register",
  beforeLoad: requireAuth,
  component: lazy(() => import("../routes/seller/register.jsx")),
});

// Tầng 1B — Code splitting: bundle seller và admin tách hẳn khỏi bundle buyer.
// Kiểm chứng thật (không phải chỉ import lazy() cho có): mở Network tab sau khi
// build, xác nhận có file seller-*.js / admin-*.js riêng, không nằm chung main.js.
const sellerLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/seller",
  beforeLoad: requireAuth,
  component: lazy(() => import("../routes/seller/layout.jsx")),
});

const sellerIndexRoute = createRoute({
  getParentRoute: () => sellerLayoutRoute,
  path: "/",
  component: lazy(() => import("../routes/seller/dashboard.jsx")),
});

// Admin: layout (sidebar + kiểm tra role) bọc các trang con qua <Outlet/>
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: requireAuth,
  component: lazy(() => import("../routes/admin/layout.jsx")),
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  component: lazy(() => import("../routes/admin/dashboard.jsx")),
});

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/categories",
  component: lazy(() => import("../routes/admin/categories.jsx")),
});

const adminShopsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/shops",
  component: lazy(() => import("../routes/admin/shops.jsx")),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: requireAuth,
  component: lazy(() => import("../routes/profile.jsx")),
});

const addressesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/addresses",
  beforeLoad: requireAuth,
  component: lazy(() => import("../routes/addresses.jsx")),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  productsIndexRoute,
  productDetailRoute,
  cartRoute,
  checkoutRoute,
  shopRoute,
  sellerRegisterRoute,
  sellerLayoutRoute.addChildren([sellerIndexRoute]),
  adminLayoutRoute.addChildren([adminIndexRoute, adminCategoriesRoute, adminShopsRoute]),
  profileRoute,
  addressesRoute,
]);

export const router = createRouter({
  routeTree,
  // Tương đương <Route path="*" element={<h1>404</h1>} /> ở react-router-dom cũ.
  notFoundComponent: () => (
    <div className="center-box">
      <h1 style={{ color: "var(--text)" }}>404 — Không tìm thấy trang</h1>
      <a href="/" className="btn btn-primary">Về trang chủ</a>
    </div>
  ),
});
