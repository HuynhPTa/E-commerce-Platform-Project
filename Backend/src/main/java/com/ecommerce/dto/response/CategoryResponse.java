package com.ecommerce.dto.response;

import java.util.List;

// children rỗng ở API dạng phẳng; có dữ liệu ở API dạng cây
public record CategoryResponse(Integer id, String name, String slug, Integer parentId, String icon,
                               int sortOrder, int depth, List<CategoryResponse> children) {}
