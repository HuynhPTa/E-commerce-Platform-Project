package com.ecommerce.service;

import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.dto.response.ProductVariantResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProductService {
    private static final int MAX_PAGE_SIZE = 100;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(String category, Long minPrice, Long maxPrice,
                                                String sort, int page, int size, String q) {
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        String safeSort = sort == null ? "newest" : sort.toLowerCase(Locale.ROOT);
        Specification<Product> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(cb.upper(root.get("status")), "ACTIVE"));
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(root.get("categoryId"), category));
            }
            if (q != null && !q.isBlank()) {
                String term = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("name")), term),
                        cb.like(cb.lower(root.get("description")), term)));
            }
            if (minPrice != null) {
                Subquery<Integer> subquery = query.subquery(Integer.class);
                var variant = subquery.from(ProductVariant.class);
                subquery.select(cb.literal(1)).where(cb.equal(variant.get("product"), root),
                        cb.ge(variant.<Long>get("priceMinor"), minPrice));
                predicates.add(cb.exists(subquery));
            }
            if (maxPrice != null) {
                Subquery<Integer> subquery = query.subquery(Integer.class);
                var variant = subquery.from(ProductVariant.class);
                subquery.select(cb.literal(1)).where(cb.equal(variant.get("product"), root),
                        cb.le(variant.<Long>get("priceMinor"), maxPrice));
                predicates.add(cb.exists(subquery));
            }

            switch (safeSort) {
                case "price_asc", "price_desc" -> {
                    Subquery<Long> priceQuery = query.subquery(Long.class);
                    var variant = priceQuery.from(ProductVariant.class);
                    priceQuery.select(cb.min(variant.<Long>get("priceMinor")))
                            .where(cb.equal(variant.get("product"), root));
                    query.orderBy(safeSort.equals("price_asc") ? cb.asc(priceQuery) : cb.desc(priceQuery));
                }
                case "best_selling" -> query.orderBy(cb.desc(root.get("soldCount")), cb.desc(root.get("createdAt")));
                default -> query.orderBy(cb.desc(root.get("createdAt")));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Pageable pageable = PageRequest.of(safePage - 1, safeSize, Sort.unsorted());
        Page<Product> result = productRepository.findAll(specification, pageable);
        return new PageResponse<>(result.getContent().stream().map(this::toResponse).toList(), safePage,
                safeSize, result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Integer id) {
        Product product = productRepository.findById(id)
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return toResponse(product);
    }

    private ProductResponse toResponse(Product product) {
        List<ProductVariantResponse> variants = product.getVariants().stream()
                .map(this::toVariantResponse).toList();
        return new ProductResponse(product.getId(), product.getName(), product.getDescription(),
                product.getCategoryId(), product.getShopId(), product.getShopName(), product.getThumbnailUrl(),
                product.getRatingAvg(), product.getRatingCount(), product.getSoldCount(), variants);
    }

    private ProductVariantResponse toVariantResponse(ProductVariant variant) {
        return new ProductVariantResponse(variant.getId(), variant.getSku(), variant.getAttributes(),
                variant.getPriceMinor(), variant.getStockQuantity(), variant.getImageUrl());
    }
}
