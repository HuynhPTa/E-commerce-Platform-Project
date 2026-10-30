package com.ecommerce.service;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.request.UserStatusRequest;
import com.ecommerce.dto.response.AdminDashboardResponse;
import com.ecommerce.dto.response.AdminUserResponse;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.PaymentMethod;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.ShopStatus;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CheckoutSessionRepository;
import com.ecommerce.repository.OrderRepository;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Kiểm tra các truy vấn Admin (dashboard, đơn hàng toàn sàn, người dùng).
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("AdminService - dashboard, đơn hàng và người dùng")
class AdminServiceIntegrationTest {

    private static final String ADMIN_EMAIL = "admin-test@test.local";
    private static final String BUYER_EMAIL = "buyer-admin@test.local";
    private static final String SELLER_EMAIL = "seller-admin@test.local";

    @Autowired
    private AdminDashboardService adminDashboardService;
    @Autowired
    private AdminOrderService adminOrderService;
    @Autowired
    private AdminUserService adminUserService;
    @Autowired
    private CheckoutService checkoutService;
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
    private ReviewRepository reviewRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanDatabase() {
        reviewRepository.deleteAll();
        orderRepository.deleteAll();
        sessionRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Admin xem được danh sách, tìm kiếm và chi tiết đơn toàn sàn")
    void xemDonToanSan() {
        Fixture fixture = createOrder();

        PageResponse<OrderSummaryResponse> all = adminOrderService.list(null, null, 1, 10);
        assertThat(all.totalItems()).isEqualTo(1);
        assertThat(all.items()).singleElement().satisfies(order -> {
            assertThat(order.id()).isEqualTo(fixture.orderId());
            assertThat(order.shopName()).isEqualTo("Shop Admin");
            assertThat(order.buyerEmail()).isEqualTo(BUYER_EMAIL);
            assertThat(order.itemCount()).isEqualTo(1);
            assertThat(order.paymentMethod()).isEqualTo("VNPAY");
        });

        PageResponse<OrderSummaryResponse> byKeyword = adminOrderService.list(null, BUYER_EMAIL, 1, 10);
        assertThat(byKeyword.totalItems()).isEqualTo(1);

        PageResponse<OrderSummaryResponse> byId = adminOrderService.list(null,
                String.valueOf(fixture.orderId()), 1, 10);
        assertThat(byId.totalItems()).isEqualTo(1);

        OrderDetailResponse detail = adminOrderService.detail(fixture.orderId());
        assertThat(detail.buyerEmail()).isEqualTo(BUYER_EMAIL);
        assertThat(detail.items()).singleElement().satisfies(item -> {
            assertThat(item.productName()).isEqualTo("Sản phẩm admin");
            assertThat(item.quantity()).isEqualTo(2);
            assertThat(item.subtotalMinor()).isEqualTo(500_000);
        });
    }

    @Test
    @DisplayName("Dashboard tổng hợp đúng số người dùng, shop, đơn và doanh thu")
    void dashboardTongHop() {
        Fixture fixture = createOrder();
        User admin = createAdmin(ADMIN_EMAIL);

        Order order = orderRepository.findById(fixture.orderId()).orElseThrow();
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        AdminDashboardResponse dashboard = adminDashboardService.getDashboard();
        assertThat(dashboard.totalUsers()).isEqualTo(3); // admin + buyer + seller
        assertThat(dashboard.activeUsers()).isEqualTo(3);
        assertThat(dashboard.totalShops()).isEqualTo(1);
        assertThat(dashboard.totalProducts()).isEqualTo(1);
        assertThat(dashboard.totalOrders()).isEqualTo(1);
        assertThat(dashboard.completedOrders()).isEqualTo(1);
        assertThat(dashboard.revenueMinor()).isEqualTo(500_000);
        assertThat(dashboard.ordersByStatus().get("COMPLETED")).isEqualTo(1);
        assertThat(dashboard.recentOrders()).hasSize(1);
        assertThat(dashboard.recentOrders().get(0).id()).isEqualTo(fixture.orderId());
        assertThat(admin.getId()).isPositive();
    }

    @Test
    @DisplayName("Admin lọc người dùng, khoá và mở khoá tài khoản")
    void quanLyNguoiDung() {
        Fixture fixture = createOrder();
        createAdmin(ADMIN_EMAIL);

        PageResponse<AdminUserResponse> users = adminUserService.list("USER", 1, "buyer-admin", 1, 10);
        assertThat(users.totalItems()).isEqualTo(1);
        assertThat(users.items()).singleElement().satisfies(user -> {
            assertThat(user.email()).isEqualTo(BUYER_EMAIL);
            assertThat(user.role()).isEqualTo("USER");
            assertThat(user.status()).isEqualTo(1);
        });

        PageResponse<AdminUserResponse> sellers = adminUserService.list("USER", 1, "seller-admin", 1, 10);
        assertThat(sellers.items()).singleElement().satisfies(user -> {
            assertThat(user.shopName()).isEqualTo("Shop Admin");
            assertThat(user.shopStatus()).isEqualTo("APPROVED");
        });

        AdminUserResponse locked = adminUserService.updateStatus(fixture.buyerId(),
                statusRequest(0), ADMIN_EMAIL);
        assertThat(locked.status()).isZero();

        AdminUserResponse unlocked = adminUserService.updateStatus(fixture.buyerId(),
                statusRequest(1), ADMIN_EMAIL);
        assertThat(unlocked.status()).isEqualTo(1);
    }

    @Test
    @DisplayName("Lọc USER vẫn thấy tài khoản cũ chưa có role (role = NULL)")
    void locUserBaoGomRoleNull() {
        User legacy = createUser("legacy-null-role@test.local");
        // Dữ liệu cũ trước khi thêm cột role có thể mang NULL; nới constraint của H2 để mô phỏng.
        jdbcTemplate.execute("ALTER TABLE user ALTER COLUMN role DROP NOT NULL");
        jdbcTemplate.update("UPDATE user SET role = NULL WHERE id = ?", legacy.getId());

        PageResponse<AdminUserResponse> users = adminUserService.list("USER", null, "legacy-null-role", 1, 10);
        assertThat(users.items()).singleElement().satisfies(user -> {
            assertThat(user.email()).isEqualTo("legacy-null-role@test.local");
            assertThat(user.role()).isEqualTo("USER");
        });

        assertThat(adminUserService.list("ADMIN", null, "legacy-null-role", 1, 10).items()).isEmpty();
    }

    @Test
    @DisplayName("Admin không thể tự khoá mình hoặc khoá tài khoản quản trị khác")
    void chanKhoaAdmin() {
        User admin = createAdmin(ADMIN_EMAIL);
        User otherAdmin = createAdmin("admin-other@test.local");

        assertThatThrownBy(() -> adminUserService.updateStatus(admin.getId(),
                statusRequest(0), ADMIN_EMAIL))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CANNOT_MODIFY_SELF));

        assertThatThrownBy(() -> adminUserService.updateStatus(otherAdmin.getId(),
                statusRequest(0), ADMIN_EMAIL))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CANNOT_LOCK_ADMIN));
    }

    // ------------------------------------------------------------------ helpers

    private UserStatusRequest statusRequest(int status) {
        UserStatusRequest request = new UserStatusRequest();
        request.setStatus(status);
        return request;
    }

    private Fixture createOrder() {
        User buyer = createUser(BUYER_EMAIL);
        User seller = createUser(SELLER_EMAIL);
        Shop shop = createShop(seller, "Shop Admin");
        Product product = createProduct(shop, "Sản phẩm admin");
        ProductVariant variant = createVariant(product, 250_000L, 5, "SKU-ADMIN");
        CartItem cartItem = addToCart(buyer, variant, 2);

        int orderId = checkoutService.checkout(buyer.getId(), checkoutRequest(cartItem.getId()))
                .getOrders().get(0).getOrderId();
        return new Fixture(orderId, buyer.getId());
    }

    private User createAdmin(String email) {
        return userRepository.save(User.builder()
                .email(email)
                .password("test-password")
                .firstName("Admin")
                .lastName("Test")
                .status(1)
                .isDelete(0)
                .admin(true)
                .role("ADMIN")
                .build());
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

    private Shop createShop(User owner, String name) {
        return shopRepository.save(Shop.builder()
                .owner(owner)
                .name(name)
                .status(ShopStatus.APPROVED)
                .build());
    }

    private Product createProduct(Shop shop, String name) {
        Product product = new Product();
        product.setName(name);
        product.setShopId(String.valueOf(shop.getId()));
        product.setShopName(shop.getName());
        product.setStatus("ACTIVE");
        return productRepository.save(product);
    }

    private ProductVariant createVariant(Product product, long priceMinor, int stock, String sku) {
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku(sku);
        variant.setAttributes(new HashMap<>(Map.of("color", "Đỏ")));
        variant.setPriceMinor(priceMinor);
        variant.setStockQuantity(stock);
        return variantRepository.save(variant);
    }

    private CartItem addToCart(User user, ProductVariant variant, int quantity) {
        CartItem item = new CartItem();
        item.setUser(user);
        item.setVariant(variant);
        item.setQuantity(quantity);
        return cartRepository.save(item);
    }

    private CheckoutRequest checkoutRequest(Integer cartItemId) {
        return CheckoutRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("123 Đường Test, Phường 1, Quận 1, TP.HCM")
                .paymentMethod(PaymentMethod.VNPAY)
                .cartItemIds(List.of(cartItemId))
                .build();
    }

    private record Fixture(int orderId, int buyerId) {
    }
}
