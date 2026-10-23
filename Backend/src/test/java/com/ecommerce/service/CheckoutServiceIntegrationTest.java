package com.ecommerce.service;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.response.CheckoutResponse;
import com.ecommerce.entity.CartItem;
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
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration test cho checkout tách đơn theo shop.
 * Chạy trên H2 in-memory (profile test), schema sinh từ entity; không đụng MySQL thật.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("CheckoutService - tách đơn theo shop")
class CheckoutServiceIntegrationTest {

    private static final int TIMEOUT_SECONDS = 30;

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

    @BeforeEach
    void cleanDatabase() {
        // Xóa theo thứ tự khóa ngoại: order_items (cascade từ orders) -> orders -> sessions
        orderRepository.deleteAll();
        sessionRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll(); // cascade product_variants
        shopRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ------------------------------------------------------------------ happy path

    @Test
    @DisplayName("1 shop: tạo đúng 1 đơn, trừ kho và xóa món khỏi giỏ")
    void checkoutMotShop() {
        User buyer = createUser("buyer1@test.local");
        Shop shop = createShop(createUser("seller1@test.local"), ShopStatus.APPROVED, "Shop Một");
        ProductVariant variant = createVariant(createProduct(shop, "ACTIVE", "Áo thun"), 250_000L, 5, "SKU-1");
        CartItem cartItem = addToCart(buyer, variant, 2);

        CheckoutResponse response = checkoutService.checkout(
                buyer.getId(), request(PaymentMethod.VNPAY, cartItem.getId()));

        assertThat(response.getCheckoutSessionId()).isPositive();
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getPaymentMethod()).isEqualTo("VNPAY");
        assertThat(response.getTotalAmountMinor()).isEqualTo(500_000);
        assertThat(response.getOrders()).singleElement().satisfies(order -> {
            assertThat(order.getShopId()).isEqualTo(shop.getId());
            assertThat(order.getStatus()).isEqualTo("PENDING");
            assertThat(order.getItemCount()).isEqualTo(1);
            assertThat(order.getSubtotalMinor()).isEqualTo(500_000);
            assertThat(order.getTotalMinor()).isEqualTo(500_000);
        });

        assertThat(variantRepository.findById(variant.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(3);
        assertThat(cartRepository.findById(cartItem.getId())).isEmpty();
        assertThat(sessionRepository.count()).isEqualTo(1);
        assertThat(orderRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Nhiều shop: 1 checkout_session + N đơn, tổng tiền đúng")
    void checkoutNhieuShop() {
        User buyer = createUser("buyer-multi@test.local");
        Shop shopA = createShop(createUser("seller-a@test.local"), ShopStatus.APPROVED, "Shop A");
        Shop shopB = createShop(createUser("seller-b@test.local"), ShopStatus.APPROVED, "Shop B");
        ProductVariant variantA = createVariant(createProduct(shopA, "ACTIVE", "Sản phẩm A"),
                100_000L, 10, "SKU-A");
        ProductVariant variantB = createVariant(createProduct(shopB, "ACTIVE", "Sản phẩm B"),
                150_000L, 10, "SKU-B");
        CartItem cartA = addToCart(buyer, variantA, 2); // 200.000
        CartItem cartB = addToCart(buyer, variantB, 3); // 450.000

        CheckoutResponse response = checkoutService.checkout(
                buyer.getId(), request(PaymentMethod.MOMO, cartA.getId(), cartB.getId()));

        assertThat(response.getTotalAmountMinor()).isEqualTo(650_000);
        assertThat(response.getOrders()).hasSize(2);

        Map<Integer, CheckoutResponse.OrderSummary> byShop = new HashMap<>();
        response.getOrders().forEach(order -> byShop.put(order.getShopId(), order));

        assertThat(byShop.get(shopA.getId()).getSubtotalMinor()).isEqualTo(200_000);
        assertThat(byShop.get(shopA.getId()).getItemCount()).isEqualTo(1);
        assertThat(byShop.get(shopB.getId()).getSubtotalMinor()).isEqualTo(450_000);
        assertThat(byShop.get(shopB.getId()).getItemCount()).isEqualTo(1);

        assertThat(variantRepository.findById(variantA.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(8);
        assertThat(variantRepository.findById(variantB.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(7);
        assertThat(sessionRepository.count()).isEqualTo(1);
        assertThat(orderRepository.count()).isEqualTo(2);
    }

    @Test
    @DisplayName("Chỉ đặt một phần giỏ: món không chọn vẫn còn trong giỏ và không bị trừ kho")
    void checkoutMotPhanGio() {
        User buyer = createUser("buyer-partial@test.local");
        Shop shop = createShop(createUser("seller-partial@test.local"), ShopStatus.APPROVED, "Shop Partial");
        ProductVariant variantA = createVariant(createProduct(shop, "ACTIVE", "Món A"), 100_000L, 5, "SKU-PA");
        ProductVariant variantB = createVariant(createProduct(shop, "ACTIVE", "Món B"), 200_000L, 5, "SKU-PB");
        CartItem cartA = addToCart(buyer, variantA, 1);
        CartItem cartB = addToCart(buyer, variantB, 1);

        CheckoutResponse response = checkoutService.checkout(
                buyer.getId(), request(PaymentMethod.VNPAY, cartA.getId()));

        assertThat(response.getTotalAmountMinor()).isEqualTo(100_000);
        assertThat(response.getOrders()).singleElement()
                .satisfies(order -> assertThat(order.getItemCount()).isEqualTo(1));
        assertThat(cartRepository.findById(cartA.getId())).isEmpty();
        assertThat(cartRepository.findById(cartB.getId())).isPresent();
        assertThat(variantRepository.findById(variantA.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(4);
        assertThat(variantRepository.findById(variantB.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(5);
    }

    // ------------------------------------------------------------------ rollback / race

    @Test
    @DisplayName("Hết hàng ở món sau: rollback toàn bộ, kho món trước được hoàn lại")
    void rollbackKhiMotMonHetHang() {
        User buyer = createUser("buyer-rollback@test.local");
        Shop shop = createShop(createUser("seller-rollback@test.local"), ShopStatus.APPROVED, "Shop Rollback");
        Product product = createProduct(shop, "ACTIVE", "Sản phẩm rollback");
        ProductVariant conHang = createVariant(product, 100_000L, 5, "SKU-RB-1");
        ProductVariant hetHang = createVariant(product, 100_000L, 0, "SKU-RB-2");
        CartItem cartConHang = addToCart(buyer, conHang, 1);
        CartItem cartHetHang = addToCart(buyer, hetHang, 1);

        // variantId tăng dần => conHang được trừ kho trước, sau đó mới tới hetHang
        assertThat(conHang.getId()).isLessThan(hetHang.getId());

        assertThatThrownBy(() -> checkoutService.checkout(
                buyer.getId(), request(PaymentMethod.VNPAY, cartConHang.getId(), cartHetHang.getId())))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INSUFFICIENT_STOCK));

        assertThat(variantRepository.findById(conHang.getId()).orElseThrow().getStockQuantity())
                .as("kho món đã trừ trước đó phải được rollback")
                .isEqualTo(5);
        assertThat(sessionRepository.count()).isZero();
        assertThat(orderRepository.count()).isZero();
        assertThat(cartRepository.findAll()).hasSize(2);
    }

    @Test
    @DisplayName("Hai người cùng mua món cuối: chỉ 1 giao dịch thành công")
    void chiMotNguoiMuaDuocMonCuoi() throws Exception {
        User buyerA = createUser("buyer-race-a@test.local");
        User buyerB = createUser("buyer-race-b@test.local");
        Shop shop = createShop(createUser("seller-race@test.local"), ShopStatus.APPROVED, "Shop Race");
        ProductVariant variant = createVariant(createProduct(shop, "ACTIVE", "Món cuối"),
                300_000L, 1, "SKU-RACE");
        CartItem cartA = addToCart(buyerA, variant, 1);
        CartItem cartB = addToCart(buyerB, variant, 1);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<Outcome> first = pool.submit(
                    () -> runCheckout(buyerA.getId(), cartA.getId(), ready, start));
            Future<Outcome> second = pool.submit(
                    () -> runCheckout(buyerB.getId(), cartB.getId(), ready, start));

            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            List<Outcome> outcomes = List.of(
                    first.get(TIMEOUT_SECONDS, TimeUnit.SECONDS),
                    second.get(TIMEOUT_SECONDS, TimeUnit.SECONDS));

            assertThat(outcomes).filteredOn(Outcome::success).hasSize(1);
            Outcome failed = outcomes.stream().filter(o -> !o.success()).findFirst().orElseThrow();
            assertThat(failed.error()).isInstanceOfSatisfying(AppException.class,
                    ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INSUFFICIENT_STOCK));
        } finally {
            pool.shutdownNow();
        }

        assertThat(variantRepository.findById(variant.getId()).orElseThrow().getStockQuantity())
                .isZero();
        assertThat(sessionRepository.count()).isEqualTo(1);
        assertThat(orderRepository.count()).isEqualTo(1);
        assertThat(cartRepository.findAll().stream().mapToInt(CartItem::getQuantity).sum())
                .as("chỉ giỏ của người thua còn hàng")
                .isEqualTo(1);
    }

    // ------------------------------------------------------------------ validation / phân quyền

    @Test
    @DisplayName("Người mua không xem được phiên checkout của người khác")
    void khongXemDuocPhienCuaNguoiKhac() {
        User buyerA = createUser("owner-a@test.local");
        User buyerB = createUser("owner-b@test.local");
        Shop shop = createShop(createUser("seller-owner@test.local"), ShopStatus.APPROVED, "Shop Owner");
        ProductVariant variant = createVariant(createProduct(shop, "ACTIVE", "Sản phẩm"),
                50_000L, 5, "SKU-OWNER");
        CartItem cartItem = addToCart(buyerA, variant, 1);

        CheckoutResponse response = checkoutService.checkout(
                buyerA.getId(), request(PaymentMethod.VNPAY, cartItem.getId()));

        assertThat(checkoutService.getResult(buyerA.getId(), response.getCheckoutSessionId()))
                .isNotNull();
        assertThatThrownBy(() -> checkoutService.getResult(
                buyerB.getId(), response.getCheckoutSessionId()))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.CHECKOUT_SESSION_NOT_FOUND));
    }

    @Test
    @DisplayName("Giỏ trống: báo CART_EMPTY")
    void gioTrong() {
        User buyer = createUser("buyer-empty@test.local");

        assertThatThrownBy(() -> checkoutService.checkout(
                buyer.getId(), request(PaymentMethod.VNPAY)))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CART_EMPTY));
    }

    @Test
    @DisplayName("cartItemIds của người khác: báo INVALID_CART_ITEM, không tạo đơn")
    void khongDungDuocMonCuaNguoiKhac() {
        User buyerA = createUser("victim@test.local");
        User buyerB = createUser("attacker@test.local");
        Shop shop = createShop(createUser("seller-cart@test.local"), ShopStatus.APPROVED, "Shop Cart");
        ProductVariant variant = createVariant(createProduct(shop, "ACTIVE", "Sản phẩm"),
                100_000L, 5, "SKU-CART");
        CartItem cartOfA = addToCart(buyerA, variant, 1);

        assertThatThrownBy(() -> checkoutService.checkout(
                buyerB.getId(), request(PaymentMethod.VNPAY, cartOfA.getId())))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_CART_ITEM));

        assertThat(cartRepository.findById(cartOfA.getId())).isPresent();
        assertThat(sessionRepository.count()).isZero();
        assertThat(variantRepository.findById(variant.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(5);
    }

    @Test
    @DisplayName("Sản phẩm không còn ACTIVE: báo PRODUCT_NOT_AVAILABLE")
    void sanPhamKhongConBan() {
        User buyer = createUser("buyer-hidden@test.local");
        Shop shop = createShop(createUser("seller-hidden@test.local"), ShopStatus.APPROVED, "Shop Hidden");
        ProductVariant variant = createVariant(createProduct(shop, "HIDDEN", "Sản phẩm ẩn"),
                100_000L, 5, "SKU-HIDDEN");
        CartItem cartItem = addToCart(buyer, variant, 1);

        assertThatThrownBy(() -> checkoutService.checkout(
                buyer.getId(), request(PaymentMethod.VNPAY, cartItem.getId())))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PRODUCT_NOT_AVAILABLE));

        assertThat(sessionRepository.count()).isZero();
        assertThat(variantRepository.findById(variant.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(5);
    }

    @Test
    @DisplayName("Shop chưa được duyệt: báo SHOP_NOT_AVAILABLE")
    void shopChuaDuocDuyet() {
        User buyer = createUser("buyer-pending@test.local");
        Shop shop = createShop(createUser("seller-pending@test.local"), ShopStatus.PENDING, "Shop Pending");
        ProductVariant variant = createVariant(createProduct(shop, "ACTIVE", "Sản phẩm"),
                100_000L, 5, "SKU-PENDING");
        CartItem cartItem = addToCart(buyer, variant, 1);

        assertThatThrownBy(() -> checkoutService.checkout(
                buyer.getId(), request(PaymentMethod.VNPAY, cartItem.getId())))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SHOP_NOT_AVAILABLE));

        assertThat(sessionRepository.count()).isZero();
        assertThat(variantRepository.findById(variant.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(5);
        assertThat(cartRepository.findById(cartItem.getId())).isPresent();
    }

    @Test
    @DisplayName("Tổng tiền vượt giới hạn int: báo CHECKOUT_TOTAL_TOO_LARGE, không trừ kho")
    void tongTienVuotGioiHan() {
        User buyer = createUser("buyer-overflow@test.local");
        Shop shop = createShop(createUser("seller-overflow@test.local"), ShopStatus.APPROVED, "Shop Overflow");
        ProductVariant variant = createVariant(createProduct(shop, "ACTIVE", "Sản phẩm đắt"),
                2_000_000_000L, 5, "SKU-OVERFLOW");
        CartItem cartItem = addToCart(buyer, variant, 2); // 4 tỷ > Integer.MAX_VALUE

        assertThatThrownBy(() -> checkoutService.checkout(
                buyer.getId(), request(PaymentMethod.VNPAY, cartItem.getId())))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.CHECKOUT_TOTAL_TOO_LARGE));

        assertThat(sessionRepository.count()).isZero();
        assertThat(orderRepository.count()).isZero();
        assertThat(variantRepository.findById(variant.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(5);
    }

    // ------------------------------------------------------------------ helpers

    private Outcome runCheckout(int buyerId, int cartItemId, CountDownLatch ready, CountDownLatch start) {
        ready.countDown();
        try {
            if (!start.await(5, TimeUnit.SECONDS)) {
                return new Outcome(false, new IllegalStateException("Hết thời gian chờ bắt đầu"));
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return new Outcome(false, ex);
        }
        try {
            checkoutService.checkout(buyerId, request(PaymentMethod.VNPAY, cartItemId));
            return new Outcome(true, null);
        } catch (Throwable ex) {
            return new Outcome(false, ex);
        }
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

    private Shop createShop(User owner, ShopStatus status, String name) {
        return shopRepository.save(Shop.builder()
                .owner(owner)
                .name(name)
                .status(status)
                .build());
    }

    private Product createProduct(Shop shop, String status, String name) {
        Product product = new Product();
        product.setName(name);
        product.setShopId(String.valueOf(shop.getId()));
        product.setShopName(shop.getName());
        product.setStatus(status);
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

    private CheckoutRequest request(PaymentMethod paymentMethod, Integer... cartItemIds) {
        return CheckoutRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("123 Đường Test, Phường 1, Quận 1, TP.HCM")
                .paymentMethod(paymentMethod)
                .cartItemIds(Arrays.asList(cartItemIds))
                .build();
    }

    private record Outcome(boolean success, Throwable error) {
    }
}
