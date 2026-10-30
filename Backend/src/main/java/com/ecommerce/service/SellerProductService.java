package com.ecommerce.service;

import com.ecommerce.dto.request.ProductCreateRequest;
import com.ecommerce.dto.request.ProductUpdateRequest;
import com.ecommerce.dto.request.VariantRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductImageResponse;
import com.ecommerce.dto.response.ProductVariantResponse;
import com.ecommerce.dto.response.SellerProductResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductImage;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.ProductImageRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.util.MediaUrlUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Bộ API dành cho Seller (Job 3). Mọi thao tác đều kiểm tra
 * shop.user_id == currentUser.id thông qua Product.shopId.
 */
@Service
@RequiredArgsConstructor
public class SellerProductService {
    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_IMAGES_PER_PRODUCT = 10;
    private static final int MAX_ATTRIBUTES = 20;
    private static final int MAX_ATTRIBUTE_LENGTH = 100;
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_DELETED = "DELETED";

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final OrderItemRepository orderItemRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ProductImageStorageService storageService;
    private final EntityManager entityManager;

    // ---------------------------------------------------------------- products

    @Transactional
    public SellerProductResponse create(String email, ProductCreateRequest request) {
        Shop shop = getShop(email);
        Category category = resolveCategory(request.getCategoryId());
        List<VariantRequest> variantRequests = request.getVariants() == null ? List.of() : request.getVariants();
        validateVariantRequests(variantRequests);

        Product product = new Product();
        product.setName(request.getName().trim());
        product.setDescription(blankToNull(request.getDescription()));
        product.setCategoryId(String.valueOf(category.getId()));
        product.setShopId(String.valueOf(shop.getId()));
        product.setShopName(shop.getName());
        product.setStatus(STATUS_ACTIVE);
        productRepository.save(product);

        if (variantRequests.isEmpty()) {
            product.getVariants().add(buildDefaultVariant(product));
        } else {
            for (VariantRequest variantRequest : variantRequests) {
                ProductVariant variant = new ProductVariant();
                variant.setProduct(product);
                applyVariant(variant, variantRequest, null);
                product.getVariants().add(variant);
            }
        }

        return toResponse(product, categoryNames());
    }

    @Transactional(readOnly = true)
    public PageResponse<SellerProductResponse> list(String email, String q, String status, int page, int size) {
        Shop shop = getShop(email);
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        String shopId = String.valueOf(shop.getId());
        String keyword = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        String statusFilter = status == null || status.isBlank() ? null : status.trim().toUpperCase(Locale.ROOT);

        Specification<Product> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("shopId"), shopId));
            if (statusFilter == null) {
                predicates.add(cb.notEqual(cb.upper(root.get("status")), STATUS_DELETED));
            } else {
                predicates.add(cb.equal(cb.upper(root.get("status")), statusFilter));
            }
            if (keyword != null) {
                predicates.add(cb.like(cb.lower(root.get("name")), keyword));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Pageable pageable = PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> result = productRepository.findAll(specification, pageable);
        Map<String, String> categoryNames = categoryNames();
        return new PageResponse<>(result.getContent().stream().map(p -> toResponse(p, categoryNames)).toList(),
                safePage, safeSize, result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public SellerProductResponse get(String email, Integer productId) {
        Shop shop = getShop(email);
        Product product = getOwnedProduct(shop, productId, false);
        return toResponse(product, categoryNames());
    }

    @Transactional
    public SellerProductResponse update(String email, Integer productId, ProductUpdateRequest request) {
        Shop shop = getShop(email);
        Product product = getOwnedProduct(shop, productId, true);
        Category category = resolveCategory(request.getCategoryId());

        product.setName(request.getName().trim());
        product.setDescription(blankToNull(request.getDescription()));
        product.setCategoryId(String.valueOf(category.getId()));
        return toResponse(product, categoryNames());
    }

    @Transactional
    public void delete(String email, Integer productId) {
        Shop shop = getShop(email);
        Product product = getOwnedProduct(shop, productId, true);
        product.setStatus(STATUS_DELETED);
    }

    // ---------------------------------------------------------------- variants

    @Transactional
    public ProductVariantResponse addVariant(String email, Integer productId, VariantRequest request) {
        Shop shop = getShop(email);
        Product product = getOwnedProduct(shop, productId, true);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        applyVariant(variant, request, null);
        return toVariantResponse(variantRepository.save(variant));
    }

    @Transactional
    public ProductVariantResponse updateVariant(String email, Integer productId, Integer variantId,
                                                 VariantRequest request) {
        Shop shop = getShop(email);
        getOwnedProduct(shop, productId, true);
        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.VARIANT_NOT_EXISTED));

        applyVariant(variant, request, variantId);
        return toVariantResponse(variant);
    }

    @Transactional
    public void deleteVariant(String email, Integer productId, Integer variantId) {
        Shop shop = getShop(email);
        getOwnedProduct(shop, productId, true);
        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.VARIANT_NOT_EXISTED));

        if (variantRepository.countByProductId(productId) <= 1) {
            throw new AppException(ErrorCode.LAST_VARIANT_DELETE_NOT_ALLOWED);
        }
        if (orderItemRepository.existsByVariantId(variantId)) {
            throw new AppException(ErrorCode.VARIANT_IN_USE);
        }

        // Gỡ variant khỏi giỏ hàng của mọi người mua trước khi xoá (tránh vi phạm khoá ngoại)
        entityManager.createQuery("delete from CartItem c where c.variant.id = :variantId")
                .setParameter("variantId", variantId)
                .executeUpdate();
        variantRepository.delete(variant);
    }

    // ---------------------------------------------------------------- images

    @Transactional
    public ProductImageResponse uploadImage(String email, Integer productId, MultipartFile file) {
        Shop shop = getShop(email);
        Product product = getOwnedProduct(shop, productId, true);

        if (imageRepository.countByProductId(productId) >= MAX_IMAGES_PER_PRODUCT) {
            throw new AppException(ErrorCode.PRODUCT_IMAGE_LIMIT_EXCEEDED);
        }

        String url = storageService.store(file);
        try {
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setUrl(url);
            image.setSortOrder(imageRepository.findMaxSortOrder(productId) + 1);
            imageRepository.save(image);

            if (product.getThumbnailUrl() == null || product.getThumbnailUrl().isBlank()) {
                product.setThumbnailUrl(url);
            }
            return toImageResponse(image);
        } catch (RuntimeException ex) {
            // Không để lại file mồ côi nếu ghi DB thất bại
            storageService.delete(url);
            throw ex;
        }
    }

    @Transactional
    public void deleteImage(String email, Integer productId, Integer imageId) {
        Shop shop = getShop(email);
        Product product = getOwnedProduct(shop, productId, true);
        ProductImage image = imageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_IMAGE_NOT_EXISTED));

        boolean wasThumbnail = image.getUrl().equals(product.getThumbnailUrl());
        ProductImage replacement = imageRepository
                .findFirstByProductIdAndIdNotOrderBySortOrderAscIdAsc(productId, imageId)
                .orElse(null);

        imageRepository.delete(image);
        if (wasThumbnail) {
            product.setThumbnailUrl(replacement == null ? null : replacement.getUrl());
        }
        storageService.delete(image.getUrl());
    }

    // ---------------------------------------------------------------- helpers

    private Shop getShop(String email) {
        User user = userRepository.findByEmailAndIsDelete(email, 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTED));
    }

    /**
     * @param activeOnly true với các thao tác ghi: sản phẩm đã xoá mềm coi như không tồn tại.
     */
    private Product getOwnedProduct(Shop shop, Integer productId, boolean activeOnly) {
        String shopId = String.valueOf(shop.getId());
        Product product = productRepository.findByIdAndShopId(productId, shopId).orElse(null);
        if (product == null) {
            // Phân biệt 404 (không có) và 403 (của shop khác)
            if (productRepository.existsById(productId)) {
                throw new AppException(ErrorCode.PRODUCT_NOT_OWNED);
            }
            throw new AppException(ErrorCode.PRODUCT_NOT_EXISTED);
        }
        if (activeOnly && STATUS_DELETED.equalsIgnoreCase(product.getStatus())) {
            throw new AppException(ErrorCode.PRODUCT_NOT_EXISTED);
        }
        return product;
    }

    private Category resolveCategory(String rawIdOrSlug) {
        String value = rawIdOrSlug == null ? "" : rawIdOrSlug.trim();
        if (value.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        Integer id = parseInteger(value);
        if (id != null) {
            return categoryRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
        }
        return categoryRepository.findBySlug(value.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
    }

    private void validateVariantRequests(List<VariantRequest> requests) {
        Set<String> seenSkus = new HashSet<>();
        for (VariantRequest request : requests) {
            validateVariantNumbers(request);
            String sku = normalizeSku(request.getSku());
            if (sku != null) {
                if (!seenSkus.add(sku.toLowerCase(Locale.ROOT))) {
                    throw new AppException(ErrorCode.VARIANT_SKU_EXISTED);
                }
                ensureSkuAvailable(sku, null);
            }
            normalizeAttributes(request.getAttributes());
        }
    }

    private void applyVariant(ProductVariant variant, VariantRequest request, Integer variantId) {
        validateVariantNumbers(request);
        String sku = normalizeSku(request.getSku());
        if (sku != null) {
            ensureSkuAvailable(sku, variantId);
        }
        variant.setSku(sku);
        variant.setAttributes(normalizeAttributes(request.getAttributes()));
        variant.setPriceMinor(request.getPriceMinor());
        variant.setStockQuantity(request.getStockQuantity());
        variant.setImageUrl(blankToNull(request.getImageUrl()));
    }

    private static void validateVariantNumbers(VariantRequest request) {
        if (request.getPriceMinor() == null || request.getStockQuantity() == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        if (request.getPriceMinor() < 0 || request.getStockQuantity() < 0) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
    }

    private void ensureSkuAvailable(String sku, Integer excludeVariantId) {
        boolean taken = excludeVariantId == null
                ? variantRepository.existsBySkuIgnoreCase(sku)
                : variantRepository.existsBySkuIgnoreCaseAndIdNot(sku, excludeVariantId);
        if (taken) {
            throw new AppException(ErrorCode.VARIANT_SKU_EXISTED);
        }
    }

    private static Map<String, String> normalizeAttributes(Map<String, String> attributes) {
        Map<String, String> result = new HashMap<>();
        if (attributes == null) {
            return result;
        }
        if (attributes.size() > MAX_ATTRIBUTES) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        attributes.forEach((key, value) -> {
            if (key == null || key.isBlank() || value == null || value.isBlank()) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            String k = key.trim();
            String v = value.trim();
            if (k.length() > MAX_ATTRIBUTE_LENGTH || v.length() > MAX_ATTRIBUTE_LENGTH) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            result.put(k, v);
        });
        return result;
    }

    private ProductVariant buildDefaultVariant(Product product) {
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku(uniqueDefaultSku(product.getId()));
        variant.setAttributes(new HashMap<>());
        variant.setPriceMinor(0);
        variant.setStockQuantity(0);
        return variant;
    }

    private String uniqueDefaultSku(Integer productId) {
        String base = "DEFAULT-" + productId;
        String sku = base;
        int suffix = 2;
        while (variantRepository.existsBySkuIgnoreCase(sku)) {
            sku = base + "-" + suffix++;
        }
        return sku;
    }

    private Map<String, String> categoryNames() {
        Map<String, String> names = new HashMap<>();
        for (Category category : categoryRepository.findAll()) {
            names.put(String.valueOf(category.getId()), category.getName());
        }
        return names;
    }

    private SellerProductResponse toResponse(Product product, Map<String, String> categoryNames) {
        List<ProductVariantResponse> variants = variantRepository
                .findAllByProductIdOrderByIdAsc(product.getId()).stream()
                .map(this::toVariantResponse)
                .toList();
        List<ProductImageResponse> images = imageRepository
                .findAllByProductIdOrderBySortOrderAscIdAsc(product.getId()).stream()
                .map(this::toImageResponse)
                .toList();
        return new SellerProductResponse(product.getId(), product.getName(), product.getDescription(),
                product.getCategoryId(), categoryNames.get(product.getCategoryId()),
                product.getShopId(), product.getShopName(), MediaUrlUtil.toAbsolute(product.getThumbnailUrl()),
                product.getStatus(), product.getRatingAvg(), product.getRatingCount(), product.getSoldCount(),
                product.getCreatedAt(), variants, images);
    }

    private ProductVariantResponse toVariantResponse(ProductVariant variant) {
        return new ProductVariantResponse(variant.getId(), variant.getSku(),
                variant.getAttributes() == null ? Map.of() : variant.getAttributes(),
                variant.getPriceMinor(), variant.getStockQuantity(),
                MediaUrlUtil.toAbsolute(variant.getImageUrl()));
    }

    private ProductImageResponse toImageResponse(ProductImage image) {
        return new ProductImageResponse(image.getId(), MediaUrlUtil.toAbsolute(image.getUrl()), image.getSortOrder());
    }

    private static Integer parseInteger(String value) {
        try {
            return Integer.valueOf(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String normalizeSku(String sku) {
        return sku == null || sku.isBlank() ? null : sku.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
