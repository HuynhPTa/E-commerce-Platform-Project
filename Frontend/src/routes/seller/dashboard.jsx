// File này nằm trong "seller" bundle riêng (xem vite.config.js manualChunks
// và router.js lazy import) — buyer thường không bao giờ tải bundle này về.
export default function SellerDashboard() {
  return (
    <section>
      <h1>Seller Dashboard</h1>
      <p>Đơn hàng, tồn kho, doanh thu cơ bản.</p>
    </section>
  );
}
