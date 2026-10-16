package com.ecommerce.service;

import com.ecommerce.dto.request.CategoryRequest;
import com.ecommerce.dto.response.CategoryResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    // ---------- Đọc ----------

    // Cây lồng nhau cho sidebar/dropdown phía người mua
    @Transactional(readOnly = true)
    public List<CategoryResponse> tree() {
        Map<Integer, List<Category>> byParent = groupByParent(categoryRepository.findAllWithParent());
        return buildTree(byParent, null, 0);
    }

    // Danh sách phẳng theo thứ tự duyệt cây (kèm depth) cho bảng Admin và ô chọn danh mục cha
    @Transactional(readOnly = true)
    public List<CategoryResponse> flat() {
        Map<Integer, List<Category>> byParent = groupByParent(categoryRepository.findAllWithParent());
        List<CategoryResponse> out = new ArrayList<>();
        walkFlat(byParent, null, 0, out);
        return out;
    }

    // Trả về id (dạng chuỗi) và slug của danh mục + toàn bộ danh mục con cháu.
    // ProductService dùng để lọc ?category=dien-thoai -> gồm cả sản phẩm ở danh mục con.
    @Transactional(readOnly = true)
    public Set<String> descendantKeys(String slugOrId) {
        List<Category> all = categoryRepository.findAllWithParent();
        Category root = all.stream()
                .filter(c -> c.getSlug().equals(slugOrId) || String.valueOf(c.getId()).equals(slugOrId))
                .findFirst().orElse(null);
        if (root == null) return Set.of(slugOrId);   // không phải danh mục đã biết: lọc đúng giá trị truyền vào

        Map<Integer, List<Category>> byParent = groupByParent(all);
        Set<String> keys = new HashSet<>();
        Deque<Category> stack = new ArrayDeque<>(List.of(root));
        while (!stack.isEmpty()) {
            Category c = stack.pop();
            keys.add(String.valueOf(c.getId()));
            keys.add(c.getSlug());
            stack.addAll(byParent.getOrDefault(c.getId(), List.of()));
        }
        return keys;
    }

    // ---------- Ghi (chỉ Admin, kiểm tra quyền ở controller bằng @PreAuthorize) ----------

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        Category c = Category.builder()
                .name(req.getName().trim())
                .parent(resolveParent(req.getParentId(), null))
                .icon(blankToNull(req.getIcon()))
                .sortOrder(req.getSortOrder())
                .build();
        c.setSlug(resolveSlug(req, null));
        return toFlat(categoryRepository.save(c), depthOf(c));
    }

    @Transactional
    public CategoryResponse update(Integer id, CategoryRequest req) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
        c.setName(req.getName().trim());
        c.setParent(resolveParent(req.getParentId(), id));
        c.setIcon(blankToNull(req.getIcon()));
        c.setSortOrder(req.getSortOrder());
        c.setSlug(resolveSlug(req, id));
        return toFlat(categoryRepository.save(c), depthOf(c));
    }

    @Transactional
    public void delete(Integer id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
        if (categoryRepository.existsByParentId(id)) {
            throw new AppException(ErrorCode.CATEGORY_HAS_CHILDREN);
        }
        if (productRepository.countByCategoryIdIn(List.of(String.valueOf(id), c.getSlug())) > 0) {
            throw new AppException(ErrorCode.CATEGORY_HAS_PRODUCTS);
        }
        categoryRepository.delete(c);
    }

    // ---------- Hỗ trợ ----------

    // selfId != null khi sửa: cha không được là chính nó hoặc một danh mục con cháu của nó (tạo vòng lặp)
    private Category resolveParent(Integer parentId, Integer selfId) {
        if (parentId == null) return null;
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
        if (selfId != null) {
            for (Category p = parent; p != null; p = p.getParent()) {
                if (p.getId().equals(selfId)) throw new AppException(ErrorCode.CATEGORY_INVALID_PARENT);
            }
        }
        return parent;
    }

    // Slug do Admin nhập mà bị trùng -> báo lỗi; slug tự sinh từ tên mà trùng -> thêm hậu tố -2, -3...
    private String resolveSlug(CategoryRequest req, Integer selfId) {
        boolean manual = req.getSlug() != null && !req.getSlug().isBlank();
        String base = manual ? req.getSlug().trim() : SlugUtil.toSlug(req.getName());
        if (base.isEmpty()) throw new AppException(ErrorCode.INVALID_INPUT);
        if (manual) {
            if (slugTaken(base, selfId)) throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTED);
            return base;
        }
        String slug = base;
        for (int i = 2; slugTaken(slug, selfId); i++) slug = base + "-" + i;
        return slug;
    }

    private boolean slugTaken(String slug, Integer selfId) {
        return selfId == null ? categoryRepository.existsBySlug(slug)
                : categoryRepository.existsBySlugAndIdNot(slug, selfId);
    }

    private static Map<Integer, List<Category>> groupByParent(List<Category> all) {
        Map<Integer, List<Category>> byParent = new HashMap<>();
        for (Category c : all) {
            Integer pid = c.getParent() == null ? null : c.getParent().getId();
            byParent.computeIfAbsent(pid, k -> new ArrayList<>()).add(c);
        }
        return byParent;   // thứ tự trong từng nhóm giữ theo sortOrder, name của truy vấn
    }

    private List<CategoryResponse> buildTree(Map<Integer, List<Category>> byParent, Integer parentId, int depth) {
        return byParent.getOrDefault(parentId, List.of()).stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getSlug(), parentId, c.getIcon(),
                        c.getSortOrder(), depth, buildTree(byParent, c.getId(), depth + 1)))
                .toList();
    }

    private void walkFlat(Map<Integer, List<Category>> byParent, Integer parentId, int depth,
                          List<CategoryResponse> out) {
        for (Category c : byParent.getOrDefault(parentId, List.of())) {
            out.add(toFlat(c, depth));
            walkFlat(byParent, c.getId(), depth + 1, out);
        }
    }

    private static int depthOf(Category c) {
        int d = 0;
        for (Category p = c.getParent(); p != null; p = p.getParent()) d++;
        return d;
    }

    private static CategoryResponse toFlat(Category c, int depth) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(),
                c.getParent() == null ? null : c.getParent().getId(), c.getIcon(), c.getSortOrder(), depth, List.of());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
