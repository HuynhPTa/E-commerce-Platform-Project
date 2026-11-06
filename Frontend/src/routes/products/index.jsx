import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useProductsQuery } from "../../queries/useProducts";
import { useDebounce } from "../../hooks/useDebounce";
import ProductCard from "../../components/product/ProductCard";
import CategorySidebar from "../../components/category/CategorySidebar";
import { useCategoryTree } from "../../queries/useCategories";
import { findCategoryPath } from "../../lib/categoryTree";

export default function ProductsPage() {
  // search params đã được validateSearch (Zod) parse ở router.js — type-safe,
  // không cần tự parse query string thủ công.
  const search = useSearch({ from: "/products" });
  const navigate = useNavigate({ from: "/products" });

  const searchQ = search.q ?? "";
  const searchMinPrice = search.minPrice ?? "";
  const searchMaxPrice = search.maxPrice ?? "";

  // Giữ giá trị người dùng đang gõ, nhưng vẫn nhận thay đổi khi back/forward đổi URL.
  // Draft ghi lại giá trị gốc trên URL; nếu URL đã khác gốc thì bỏ draft và lấy lại từ URL.
  const [qDraft, setQDraft] = useState(null);
  const [minPriceDraft, setMinPriceDraft] = useState(null);
  const [maxPriceDraft, setMaxPriceDraft] = useState(null);

  const qInput = qDraft?.base === searchQ ? qDraft.value : searchQ;
  const minPriceInput = minPriceDraft?.base === searchMinPrice
    ? minPriceDraft.value
    : searchMinPrice;
  const maxPriceInput = maxPriceDraft?.base === searchMaxPrice
    ? maxPriceDraft.value
    : searchMaxPrice;

  const debouncedQ = useDebounce(qInput, 400); // client state thuần, từ hooks/

  const filters = { ...search, q: debouncedQ };

  useEffect(() => {
    if (debouncedQ !== searchQ) {
      navigate({ search: (prev) => ({ ...prev, q: debouncedQ || undefined, page: 1 }) });
    }
  }, [debouncedQ, navigate, searchQ]);

  // Danh mục chọn ở sidebar nằm trên URL (?category=slug); BE lọc gồm cả danh mục con.
  // Đường dẫn danh mục (Điện thoại & Phụ kiện > Tai nghe) dùng cho breadcrumb.
  const { data: tree } = useCategoryTree();
  const categoryPath = findCategoryPath(tree, search.category);

  // Server state: fetch qua TanStack Query, KHÔNG qua useState/useEffect thủ công.
  const { data, isLoading, isError, error, isFetching } = useProductsQuery(filters);

  function updateSort(sort) {
    navigate({ search: (prev) => ({ ...prev, sort, page: 1 }) });
  }

  function applyFilters(event) {
    event.preventDefault();
    navigate({ search: (prev) => ({
      ...prev,
      minPrice: minPriceInput === "" ? undefined : Number(minPriceInput),
      maxPrice: maxPriceInput === "" ? undefined : Number(maxPriceInput),
      page: 1,
    }) });
  }

  function goToPage(page) {
    navigate({ search: (prev) => ({ ...prev, page }) });
  }

  return (
    <div className="with-sidebar">
      <CategorySidebar activeSlug={search.category} />

      <section>
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/products" search={{}}>Sản phẩm</Link>
          {categoryPath.map((c) => (
            <span key={c.id} className="row" style={{ gap: 6 }}>
              <ChevronRight size={14} />
              <Link to="/products" search={(prev) => ({ ...prev, category: c.slug, page: 1 })}>{c.name}</Link>
            </span>
          ))}
        </nav>

        <form className="product-filters card card-body" onSubmit={applyFilters}>
          <label>
            Tìm sản phẩm
            <input
              value={qInput}
              onChange={(e) => setQDraft({ base: searchQ, value: e.target.value })}
              placeholder="Tên sản phẩm…"
            />
          </label>
          <label>
            Giá từ (₫)
            <input
              type="number"
              min="0"
              value={minPriceInput}
              onChange={(e) => setMinPriceDraft({ base: searchMinPrice, value: e.target.value })}
            />
          </label>
          <label>
            Giá đến (₫)
            <input
              type="number"
              min="0"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceDraft({ base: searchMaxPrice, value: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary">Lọc sản phẩm</button>
        </form>

        <div className="toolbar">
          <span className="muted">Sắp xếp theo</span>
          <select value={search.sort} onChange={(e) => updateSort(e.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="best_selling">Bán chạy</option>
          </select>
          {isFetching && <span className="muted">Đang cập nhật…</span>}
        </div>

        {isLoading && <p>Đang tải sản phẩm…</p>}
        {isError && <p role="alert">Lỗi tải sản phẩm: {error.message}</p>}

        {data && (
          <>
            <div className="product-grid">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {data.items.length === 0 && <div className="card center-box">Không tìm thấy sản phẩm phù hợp.</div>}

            <div className="pagination">
              <button disabled={search.page <= 1} onClick={() => goToPage(search.page - 1)}>
                Trước
              </button>
              <span>Trang {search.page} / {Math.max(1, data.totalPages)}</span>
              <button
                disabled={search.page >= data.totalPages}
                onClick={() => goToPage(search.page + 1)}
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}










