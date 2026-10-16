import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import { useCategoryTree } from "../../queries/useCategories";
import CategoryIcon from "./CategoryIcon";

// Menu "Danh mục" trên header: cột trái là danh mục gốc, rê chuột vào để xem danh mục con/cháu bên phải
export default function CategoryDropdown() {
  const { data: tree = [] } = useCategoryTree();
  const [open, setOpen] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const closeTimer = useRef();

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const show = () => { clearTimeout(closeTimer.current); setOpen(true); };
  // trễ 150ms để rê chuột từ nút xuống bảng menu không bị đóng giữa chừng
  const hide = () => { closeTimer.current = setTimeout(() => setOpen(false), 150); };
  const close = () => setOpen(false);

  const active = tree.find((c) => c.id === hoverId) ?? tree[0];

  return (
    <div className="cat-dropdown" onMouseEnter={show} onMouseLeave={hide}>
      <button className="cat-dropdown-trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <LayoutGrid size={16} /> Danh mục <ChevronDown size={14} />
      </button>

      {open && tree.length > 0 && (
        <div className="cat-panel">
          <nav className="cat-panel-roots">
            {tree.map((c) => (
              <Link key={c.id} to="/products" search={{ category: c.slug }}
                    className={active?.id === c.id ? "hover" : ""}
                    onMouseEnter={() => setHoverId(c.id)} onClick={close}>
                <CategoryIcon name={c.icon} size={17} />
                {c.name}
                {c.children.length > 0 && <ChevronRight size={14} className="chev" />}
              </Link>
            ))}
          </nav>

          {active && (
            <div className="cat-panel-children">
              <h4><Link to="/products" search={{ category: active.slug }} onClick={close}>{active.name}</Link></h4>
              {active.children.length === 0 && <span className="muted">Chưa có danh mục con</span>}
              {active.children.map((child) => (
                <div key={child.id}>
                  <Link to="/products" search={{ category: child.slug }} onClick={close}>{child.name}</Link>
                  {child.children.map((g) => (
                    <Link key={g.id} className="grand" to="/products" search={{ category: g.slug }} onClick={close}>
                      {g.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
