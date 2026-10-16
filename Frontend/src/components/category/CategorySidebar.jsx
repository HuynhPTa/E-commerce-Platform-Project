import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ListTree } from "lucide-react";
import { useCategoryTree } from "../../queries/useCategories";
import { findCategoryPath } from "../../lib/categoryTree";
import CategoryIcon from "./CategoryIcon";

function TreeNode({ node, activeSlug, expanded, toggle }) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  return (
    <li>
      <div className="cat-node">
        {hasChildren ? (
          <button className="cat-toggle" onClick={() => toggle(node.id)} aria-label={isOpen ? "Thu gọn" : "Mở rộng"}>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : <span className="cat-toggle-spacer" />}
        <Link to="/products" search={(prev) => ({ ...prev, category: node.slug, page: 1 })}
              className={node.slug === activeSlug ? "selected" : ""}>
          {node.depth === 0 && <CategoryIcon name={node.icon} size={16} />}
          {node.name}
        </Link>
      </div>
      {hasChildren && isOpen && (
        <ul className="cat-tree">
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} activeSlug={activeSlug} expanded={expanded} toggle={toggle} />
          ))}
        </ul>
      )}
    </li>
  );
}

// Sidebar cây danh mục ở trang sản phẩm; tự mở sẵn nhánh chứa danh mục đang chọn
export default function CategorySidebar({ activeSlug }) {
  const { data: tree = [], isLoading } = useCategoryTree();
  const activePathIds = useMemo(
    () => findCategoryPath(tree, activeSlug).map((c) => c.id),
    [tree, activeSlug]
  );
  // Các nhánh người dùng tự mở/đóng; nhánh của danh mục đang chọn luôn được mở
  const [manual, setManual] = useState(() => new Map());
  const expanded = useMemo(() => {
    const set = new Set(activePathIds);
    manual.forEach((open, id) => (open ? set.add(id) : set.delete(id)));
    return set;
  }, [activePathIds, manual]);

  const toggle = (id) => setManual((prev) => new Map(prev).set(id, !expanded.has(id)));

  return (
    <aside className="card cat-sidebar">
      <div className="cat-sidebar-title"><ListTree size={18} /> Danh mục</div>
      {isLoading ? (
        <p className="muted" style={{ padding: "8px 16px" }}>Đang tải…</p>
      ) : (
        <ul className="cat-tree">
          <li>
            <div className="cat-node">
              <span className="cat-toggle-spacer" />
              <Link to="/products" search={(prev) => ({ ...prev, category: undefined, page: 1 })}
                    className={!activeSlug ? "selected" : ""}>
                Tất cả sản phẩm
              </Link>
            </div>
          </li>
          {tree.map((node) => (
            <TreeNode key={node.id} node={node} activeSlug={activeSlug} expanded={expanded} toggle={toggle} />
          ))}
        </ul>
      )}
    </aside>
  );
}
