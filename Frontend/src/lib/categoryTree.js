// Hàm thuần xử lý cây danh mục (không gọi API, không dùng React)

// Đường đi từ gốc tới danh mục có slug cho trước: [gốc, ..., danh mục đó]; [] nếu không thấy
export function findCategoryPath(tree, slug) {
  if (!slug || !tree) return [];
  for (const node of tree) {
    if (node.slug === slug) return [node];
    const sub = findCategoryPath(node.children, slug);
    if (sub.length) return [node, ...sub];
  }
  return [];
}

// Tập id của một danh mục và toàn bộ con cháu (dùng để loại khỏi ô chọn "danh mục cha")
export function descendantIds(flat, id) {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of flat) {
      if (c.parentId != null && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        changed = true;
      }
    }
  }
  return ids;
}
