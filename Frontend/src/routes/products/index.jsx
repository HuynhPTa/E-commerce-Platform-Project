import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useProductsQuery } from "../../queries/useProducts";
import { useDebounce } from "../../hooks/useDebounce";
import ProductCard from "../../components/product/ProductCard";

export default function ProductsPage() {
  // search params đã được validateSearch (Zod) parse ở router.js — type-safe,
  // không cần tự parse query string thủ công.
  const search = useSearch({ from: "/products" });
  const navigate = useNavigate({ from: "/products" });

  const [qInput, setQInput] = useState(search.q ?? "");
  const debouncedQ = useDebounce(qInput, 400); // client state thuần, từ hooks/

  const filters = { ...search, q: debouncedQ };

  // Server state: fetch qua TanStack Query, KHÔNG qua useState/useEffect thủ công.
  const { data, isLoading, isError, error, isFetching } = useProductsQuery(filters);

  function updateSort(sort) {
    navigate({ search: (prev) => ({ ...prev, sort, page: 1 }) });
  }

  function goToPage(page) {
    navigate({ search: (prev) => ({ ...prev, page }) });
  }

  if (isLoading) return <p>Đang tải sản phẩm…</p>;
  if (isError) return <p>Lỗi tải sản phẩm: {error.message}</p>;

  return (
    <section>
      <input
        value={qInput}
        onChange={(e) => setQInput(e.target.value)}
        placeholder="Tìm sản phẩm…"
      />

      <select value={search.sort} onChange={(e) => updateSort(e.target.value)}>
        <option value="newest">Mới nhất</option>
        <option value="price_asc">Giá tăng dần</option>
        <option value="price_desc">Giá giảm dần</option>
        <option value="best_selling">Bán chạy</option>
      </select>

      {isFetching && <span>Đang cập nhật…</span>}

      <div className="product-grid">
        {data.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="pagination">
        <button disabled={search.page <= 1} onClick={() => goToPage(search.page - 1)}>
          Trước
        </button>
        <span>Trang {search.page} / {data.totalPages}</span>
        <button
          disabled={search.page >= data.totalPages}
          onClick={() => goToPage(search.page + 1)}
        >
          Sau
        </button>
      </div>
    </section>
  );
}
