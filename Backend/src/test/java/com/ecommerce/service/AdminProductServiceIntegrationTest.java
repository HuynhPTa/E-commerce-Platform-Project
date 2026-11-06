package com.ecommerce.service;

import com.ecommerce.dto.request.ProductCreateRequest;
import com.ecommerce.dto.request.ProductUpdateRequest;
import com.ecommerce.dto.request.VariantRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductVariantResponse;
import com.ecommerce.dto.response.SellerProductResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.ShopStatus;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.CheckoutSessionRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Kiểm tra API quản trị sản phẩm dùng chung nghiệp vụ seller nhưng không giới hạn shop.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("AdminProductService - quản trị sản phẩm single-brand")
class AdminProductServiceIntegrationTest {

    @Autowired
    private SellerProductService productService;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ShopRepository shopRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductVariantRepository variantRepository;
    @Autowired
    private CartItemRepository cartRepository;
    @Autowired
    private CheckoutSessionRepository sessionRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private ReviewRepository reviewRepository;

    private Category category;

    @BeforeEach
    void cleanDatabase() {
        reviewRepository.deleteAll();
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        sessionRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        category = categoryRepository.save(Category.builder()
                .name("Thời trang")
                .slug("thoi-trang")
                .build());
    }

    @Test
    @DisplayName("Admin tạo sản phẩm vào shop chính thức và trả đủ biến thể, danh mục")
    void adminTaoSanPhamVaoShopChinhThuc() {
        Shop official = createShop("official@test.local", "MarketHub Official");
        createShop("legacy@test.local", "Shop cũ");

        ProductCreateRequest request = createRequest("Áo thun nam", 199_000L, 12, "AO-THUN-NAM");
        SellerProductResponse created = productService.createForAdmin(request);

        assertThat(created.id()).isPositive();
        assertThat(created.name()).isEqualTo("Áo thun nam");
        assertThat(created.shopId()).isEqualTo(String.valueOf(official.getId()));
        assertThat(created.shopName()).isEqualTo("MarketHub Official");
        assertThat(created.categoryName()).isEqualTo("Thời trang");
        assertThat(created.status()).isEqualTo("ACTIVE");
        assertThat(created.variants()).singleElement().satisfies(variant -> {
            assertThat(variant.sku()).isEqualTo("AO-THUN-NAM");
            assertThat(variant.priceMinor()).isEqualTo(199_000L);
            assertThat(variant.stockQuantity()).isEqualTo(12);
        });
        assertThat(productService.getForAdmin(created.id()).name()).isEqualTo("Áo thun nam");
    }

    @Test
    @DisplayName("Admin không tạo được sản phẩm khi chưa có shop APPROVED")
    void adminTaoSanPhamKhiChuaCoShop() {
        assertThatThrownBy(() -> productService.createForAdmin(
                createRequest("Áo thun", 100_000L, 1, "AO-1")))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SHOP_NOT_EXISTED));
    }

    @Test
    @DisplayName("Admin xem toàn bộ sản phẩm mọi shop, tìm kiếm và lọc trạng thái")
    void adminXemSanPhamMoiShop() {
        Shop shop1 = createShop("shop1@test.local", "Shop Một");
        Shop shop2 = createShop("shop2@test.local", "Shop Hai");
        Product product1 = createProduct(shop1, "Áo khoác gió");
        Product product2 = createProduct(shop2, "Quần jean");

        PageResponse<SellerProductResponse> all = productService.listForAdmin(null, null, 1, 10);
        assertThat(all.totalItems()).isEqualTo(2);
        assertThat(all.items()).extracting(SellerProductResponse::id)
                .containsExactlyInAnyOrder(product1.getId(), product2.getId());

        PageResponse<SellerProductResponse> byKeyword = productService.listForAdmin("khoác", null, 1, 10);
        assertThat(byKeyword.totalItems()).isEqualTo(1);
        assertThat(byKeyword.items()).singleElement()
                .satisfies(product -> assertThat(product.name()).isEqualTo("Áo khoác gió"));

        productService.deleteForAdmin(product2.getId());
        PageResponse<SellerProductResponse> deleted = productService.listForAdmin(null, "DELETED", 1, 10);
        assertThat(deleted.totalItems()).isEqualTo(1);
        assertThat(deleted.items()).singleElement()
                .satisfies(product -> assertThat(product.id()).isEqualTo(product2.getId()));
        assertThat(productService.listForAdmin(null, null, 1, 10).totalItems()).isEqualTo(1);

        assertThatThrownBy(() -> productService.updateForAdmin(product2.getId(), updateRequest("Quần jean mới")))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PRODUCT_NOT_EXISTED));
    }

    @Test
    @DisplayName("Admin sửa sản phẩm của shop bất kỳ và xoá mềm")
    void adminSuaVaXoaSanPhamShopKhac() {
        Shop shop1 = createShop("shop1@test.local", "Shop Một");
        Product product = createProduct(shop1, "Áo khoác gió");

        SellerProductResponse updated = productService.updateForAdmin(product.getId(),
                updateRequest("Áo khoác gió cao cấp"));
        assertThat(updated.name()).isEqualTo("Áo khoác gió cao cấp");

        productService.deleteForAdmin(product.getId());
        assertThat(productService.getForAdmin(product.getId()).status()).isEqualTo("DELETED");
        assertThatThrownBy(() -> productService.deleteForAdmin(999_999))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PRODUCT_NOT_EXISTED));
    }

    @Test
    @DisplayName("Admin thêm, sửa, xoá biến thể và chặn xoá biến thể cuối")
    void adminQuanLyBienThe() {
        Shop shop = createShop("shop1@test.local", "Shop Một");
        Product product = createProduct(shop, "Áo thun");

        ProductVariantResponse first = productService.addVariantForAdmin(product.getId(),
                variantRequest("SKU-DEN-L", 150_000L, 5, "Đen", "L"));
        assertThat(first.sku()).isEqualTo("SKU-DEN-L");

        ProductVariantResponse second = productService.addVariantForAdmin(product.getId(),
                variantRequest("SKU-TRANG-M", 160_000L, 3, "Trắng", "M"));
        assertThat(second.sku()).isEqualTo("SKU-TRANG-M");

        ProductVariantResponse updated = productService.updateVariantForAdmin(product.getId(), first.id(),
                variantRequest("SKU-DEN-L", 170_000L, 4, "Đen", "L"));
        assertThat(updated.priceMinor()).isEqualTo(170_000L);
        assertThat(updated.stockQuantity()).isEqualTo(4);

        productService.deleteVariantForAdmin(product.getId(), second.id());
        assertThat(productService.getForAdmin(product.getId()).variants()).hasSize(1);
        assertThatThrownBy(() -> productService.deleteVariantForAdmin(product.getId(), first.id()))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.LAST_VARIANT_DELETE_NOT_ALLOWED));
    }

    @Test
    @DisplayName("Admin không đổi được SKU trùng với biến thể khác")
    void adminChanSkuTrung() {
        Shop shop = createShop("shop1@test.local", "Shop Một");
        Product product = createProduct(shop, "Áo thun");
        productService.addVariantForAdmin(product.getId(),
                variantRequest("SKU-1", 100_000L, 1, "Đen", "L"));

        assertThatThrownBy(() -> productService.addVariantForAdmin(product.getId(),
                variantRequest("sku-1", 100_000L, 1, "Trắng", "M")))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.VARIANT_SKU_EXISTED));
    }

    // ------------------------------------------------------------------ helpers

    private ProductCreateRequest createRequest(String name, long priceMinor, int stock, String sku) {
        ProductCreateRequest request = new ProductCreateRequest();
        request.setName(name);
        request.setDescription("Mô tả sản phẩm");
        request.setCategoryId(String.valueOf(category.getId()));
        request.setVariants(List.of(variantRequest(sku, priceMinor, stock, "Đen", "L")));
        return request;
    }

    private ProductUpdateRequest updateRequest(String name) {
        ProductUpdateRequest request = new ProductUpdateRequest();
        request.setName(name);
        request.setDescription("Mô tả mới");
        request.setCategoryId(String.valueOf(category.getId()));
        return request;
    }

    private VariantRequest variantRequest(String sku, long priceMinor, int stock,
                                          String color, String size) {
        VariantRequest request = new VariantRequest();
        request.setSku(sku);
        request.setAttributes(new HashMap<>(Map.of("color", color, "size", size)));
        request.setPriceMinor(priceMinor);
        request.setStockQuantity(stock);
        return request;
    }

    private User createUser(String email) {
        return userRepository.save(User.builder()
                .email(email)
                .password("test-password")
                .firstName("Test")
                .lastName("User")
                .status(1)
                .isDelete(0)
                .admin(false)
                .build());
    }

    private Shop createShop(String ownerEmail, String name) {
        return shopRepository.save(Shop.builder()
                .owner(createUser(ownerEmail))
                .name(name)
                .status(ShopStatus.APPROVED)
                .build());
    }

    private Product createProduct(Shop shop, String name) {
        Product product = new Product();
        product.setName(name);
        product.setCategoryId(String.valueOf(category.getId()));
        product.setShopId(String.valueOf(shop.getId()));
        product.setShopName(shop.getName());
        product.setStatus("ACTIVE");
        return productRepository.save(product);
    }

    private void createVariant(Product product, String sku) {
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku(sku);
        variant.setAttributes(new HashMap<>());
        variant.setPriceMinor(100_000L);
        variant.setStockQuantity(1);
        variantRepository.save(variant);
    }
}
