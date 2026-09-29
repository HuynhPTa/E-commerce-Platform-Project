import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient } from "./lib/queryClient";
import { router } from "./lib/router";

// Tầng 1A/1B — điều kiện tối thiểu ở App.jsx:
// "Bọc QueryClientProvider + RouterProvider; có <ReactQueryDevtools/> (bản dev);
//  có ít nhất 1 ErrorBoundary bọc route tree" (ErrorBoundary đặt trong __root.jsx,
// bọc <Outlet/> — xem routes/__root.jsx).
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
