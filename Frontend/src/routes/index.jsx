import { Link } from "@tanstack/react-router";

export default function HomePage() {
  return (
    <section>
      <h1>Chào mừng đến sàn TMĐT</h1>
      <Link to="/products">Xem sản phẩm</Link>
    </section>
  );
}
