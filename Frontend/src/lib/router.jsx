import { createRouter, createRootRoute, createRoute } from "@tanstack/react-router";
import { lazy } from "react";
import RootLayout from "../routes/__root.jsx";
import { productSearchSchema } from "../schemas/product-search.schema";
import { redirect } from "@tanstack/react-router";
import { hasToken } from "../queries/useMe";
// Tầng 1B — TanStack Router: tổ chức route + route params có validate.
const rootRoute = createRootRoute({ component: RootLayout });

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

// Tầng 1B — Code splitting: bundle seller và admin tách hẳn khỏi bundle buyer.
// Kiểm chứng thật (không phải chỉ import lazy() cho có): mở Network tab sau khi
// build, xác nhận có file seller-*.js / admin-*.js riêng, không nằm chung main.js.
const sellerLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/seller",
  component: lazy(() => import("../routes/seller/dashboard.jsx")),
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: lazy(() => import("../routes/admin/dashboard.jsx")),
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: () => {
    if (!hasToken()) throw redirect({ to: "/login" });
  },
  component: lazy(() => import("../routes/profile.jsx")),
});

const addressesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/addresses",
  beforeLoad: () => {
    if (!hasToken()) throw redirect({ to: "/login" });
  },
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
  sellerLayoutRoute,
  adminLayoutRoute,
  profileRoute,
  addressesRoute,
]);

export const router = createRouter({
  routeTree,
  // Tương đương <Route path="*" element={<h1>404</h1>} /> ở react-router-dom cũ.
  notFoundComponent: () => <h1>404 - Không tìm thấy trang</h1>,
});

