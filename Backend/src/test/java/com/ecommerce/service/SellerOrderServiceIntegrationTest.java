package com.ecommerce.service;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.request.OrderStatusRequest;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.SellerDashboardResponse;
import com.ecommerce.entity.CartItem;
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
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Kiểm tra luồng xử lý đơn của người bán trên H2 in-memory.
 * Không dùng MySQL thật, không phụ thuộc dữ liệu seed.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("SellerOrderService - xử lý đơn và hoàn kho")
class SellerOrderServiceIntegrationTest {

    private static final String SELLER_EMAIL = "seller-order@test.local";
    private static final String BUYER_EMAIL = "buyer-order@test.local";

    @Autowired
    private SellerOrderService sellerOrderService;
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
    @DisplayName("Đơn PENDING: xác nhận, giao hàng, hoàn tất; dashboard và danh sách cập nhật đúng")
    void xuLyDonDenKhiHoanTat() {
        Fixture fixture = createOrder();

        OrderDetailResponse confirmed = update(fixture.orderId(), OrderStatus.CONFIRMED);
        assertThat(confirmed.status()).isEqualTo("CONFIRMED");

        assertThat(update(fixture.orderId(), OrderStatus.SHIPPING).status()).isEqualTo("SHIPPING");
        assertThat(update(fixture.orderId(), OrderStatus.DELIVERED).status()).isEqualTo("DELIVERED");
        assertThat(update(fixture.orderId(), OrderStatus.COMPLETED).status()).isEqualTo("COMPLETED");

        SellerDashboardResponse dashboard = sellerOrderService.dashboard(SELLER_EMAIL);
        assertThat(dashboard.productCount()).isEqualTo(1);
        assertThat(dashboard.totalOrders()).isEqualTo(1);
        assertThat(dashboard.completedOrders()).isEqualTo(1);
        assertThat(dashboard.revenueMinor()).isEqualTo(500_000);
        assertThat(dashboard.ordersByStatus().get("COMPLETED")).isEqualTo(1);

        PageResponse<OrderSummaryResponse> list = sellerOrderService.list(
                SELLER_EMAIL, OrderStatus.COMPLETED, null, 1, 10);
        assertThat(list.totalItems()).isEqualTo(1);
        assertThat(list.items()).singleElement().satisfies(order -> {
            assertThat(order.id()).isEqualTo(fixture.orderId());
            assertThat(order.shopName()).isEqualTo("Shop Order");
            assertThat(order.buyerEmail()).isEqualTo(BUYER_EMAIL);
            assertThat(order.itemCount()).isEqualTo(1);
            assertThat(order.totalMinor()).isEqualTo(500_000);
        });
    }

    @Test
    @DisplayName("Huỷ đơn trước khi giao: hoàn lại đúng số lượng tồn kho")
    void huyDonHoanKho() {
        Fixture fixture = createOrder();
        assertThat(stock(fixture.variantId())).isEqualTo(3); // 5 - 2

        update(fixture.orderId(), OrderStatus.CONFIRMED);
        OrderDetailResponse cancelled = update(fixture.orderId(), OrderStatus.CANCELLED);

        assertThat(cancelled.status()).isEqualTo("CANCELLED");
        assertThat(stock(fixture.variantId())).isEqualTo(5);
    }

    @Test
    @DisplayName("Chuyển trạng thái sai (PENDING -> COMPLETED) bị chặn")
    void chuyenTrangThaiSai() {
        Fixture fixture = createOrder();

        assertThatThrownBy(() -> update(fixture.orderId(), OrderStatus.COMPLETED))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION));
        assertThat(stock(fixture.variantId())).isEqualTo(3);
    }

    @Test
    @DisplayName("Shop khác không xem được đơn của shop mình")
    void khongXemDuocDonShopKhac() {
        Fixture fixture = createOrder();
        createShop(createUser("other-seller@test.local"), "Shop Khác");

        assertThatThrownBy(() -> sellerOrderService.detail("other-seller@test.local", fixture.orderId()))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ORDER_NOT_EXISTED));
    }

    // ------------------------------------------------------------------ helpers

    private OrderDetailResponse update(int orderId, OrderStatus status) {
        OrderStatusRequest request = new OrderStatusRequest();
        request.setStatus(status);
        return sellerOrderService.updateStatus(SELLER_EMAIL, orderId, request);
    }

    private int stock(int variantId) {
        return variantRepository.findById(variantId).orElseThrow().getStockQuantity();
    }

    private Fixture createOrder() {
        User buyer = createUser(BUYER_EMAIL);
        User seller = createUser(SELLER_EMAIL);
        Shop shop = createShop(seller, "Shop Order");
        Product product = createProduct(shop, "Sản phẩm test");
        ProductVariant variant = createVariant(product, 250_000L, 5, "SKU-ORDER");
        CartItem cartItem = addToCart(buyer, variant, 2);

        int orderId = checkoutService.checkout(buyer.getId(), checkoutRequest(cartItem.getId()))
                .getOrders().get(0).getOrderId();
        return new Fixture(orderId, variant.getId());
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

    private record Fixture(int orderId, int variantId) {
    }
}
