import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProductsQuery } from "../../queries/useProducts";
import { useDebounce } from "../../hooks/useDebounce";
import ProductCard from "../../components/product/ProductCard";

export default function ProductsPage() {
  // search params đã được validateSearch (Zod) parse ở router.js — type-safe,
  // không cần tự parse query string thủ công.
  const search = useSearch({ from: "/products" });
  const navigate = useNavigate({ from: "/products" });

  const [qInput, setQInput] = useState(search.q ?? "");
  const [categoryInput, setCategoryInput] = useState(search.category ?? "");
  const [minPriceInput, setMinPriceInput] = useState(search.minPrice ?? "");
  const [maxPriceInput, setMaxPriceInput] = useState(search.maxPrice ?? "");
  const debouncedQ = useDebounce(qInput, 400); // client state thuần, từ hooks/

  const filters = { ...search, q: debouncedQ };

  useEffect(() => {
    setQInput(search.q ?? "");
    setCategoryInput(search.category ?? "");
    setMinPriceInput(search.minPrice ?? "");
    setMaxPriceInput(search.maxPrice ?? "");
  }, [search.category, search.maxPrice, search.minPrice, search.q]);

  useEffect(() => {
    if (debouncedQ !== (search.q ?? "")) {
      navigate({ search: (prev) => ({ ...prev, q: debouncedQ || undefined, page: 1 }) });
    }
  }, [debouncedQ, navigate, search.q]);

  // Server state: fetch qua TanStack Query, KHÔNG qua useState/useEffect thủ công.
  const { data, isLoading, isError, error, isFetching } = useProductsQuery(filters);

  function updateSort(sort) {
    navigate({ search: (prev) => ({ ...prev, sort, page: 1 }) });
  }

  function applyFilters(event) {
    event.preventDefault();
    navigate({ search: (prev) => ({
      ...prev,
      category: categoryInput.trim() || undefined,
      minPrice: minPriceInput === "" ? undefined : Number(minPriceInput),
      maxPrice: maxPriceInput === "" ? undefined : Number(maxPriceInput),
      page: 1,
    }) });
  }

  function goToPage(page) {
    navigate({ search: (prev) => ({ ...prev, page }) });
  }

  if (isLoading) return <p>Đang tải sản phẩm…</p>;
  if (isError) return <p>Lỗi tải sản phẩm: {error.message}</p>;

  return (
    <section>
      <form className="product-filters" onSubmit={applyFilters}>
        <label>
          Tìm sản phẩm
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Tên sản phẩm…" />
        </label>
        <label>
          Mã danh mục
          <input value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} />
        </label>
        <label>
          Giá từ (₫)
          <input type="number" min="0" value={minPriceInput} onChange={(e) => setMinPriceInput(e.target.value)} />
        </label>
        <label>
          Giá đến (₫)
          <input type="number" min="0" value={maxPriceInput} onChange={(e) => setMaxPriceInput(e.target.value)} />
        </label>
        <button type="submit">Lọc sản phẩm</button>
      </form>

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
      {data.items.length === 0 && <p>Không tìm thấy sản phẩm phù hợp.</p>}

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
