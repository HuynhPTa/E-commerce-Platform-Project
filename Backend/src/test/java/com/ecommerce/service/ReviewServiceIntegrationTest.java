package com.ecommerce.service;

import com.ecommerce.dto.request.ReviewCreateRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ReviewEligibilityResponse;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.entity.CheckoutSession;
import com.ecommerce.entity.CheckoutStatus;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
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

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration test cho đánh giá sản phẩm.
 * Chạy trên H2 in-memory (profile test), schema sinh từ entity; không đụng MySQL thật.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("ReviewService - đánh giá sản phẩm")
class ReviewServiceIntegrationTest {

    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    private ReviewService reviewService;
    @Autowired
    private ReviewRepository reviewRepository;
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
        reviewRepository.deleteAll();
        orderRepository.deleteAll();
        sessionRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Đơn COMPLETED: tạo review và cập nhật rating_avg/rating_count")
    void taoReviewThanhCong() {
        Purchase purchase = createPurchase(OrderStatus.COMPLETED);

        ReviewResponse response = reviewService.create(purchase.buyer().getId(),
                request(purchase.items().get(0).getId(), 5, "  Rất tốt  "));

        assertThat(response.rating()).isEqualTo(5);
        assertThat(response.comment()).isEqualTo("Rất tốt");
        assertThat(response.userName()).isNotBlank();
        assertThat(reviewRepository.count()).isEqualTo(1);

        Product product = productRepository.findById(purchase.product().getId()).orElseThrow();
        assertThat(product.getRatingCount()).isEqualTo(1);
        assertThat(product.getRatingAvg()).isEqualTo(5.0);
    }

    @Test
    @DisplayName("Nhiều review: rating_avg là trung bình, làm tròn 1 chữ số")
    void trungBinhNhieuReview() {
        Purchase first = createPurchase(OrderStatus.COMPLETED);
        Purchase second = createPurchase(OrderStatus.COMPLETED,
                first.buyer(), first.product(), first.variants().get(0));

        reviewService.create(first.buyer().getId(), request(first.items().get(0).getId(), 4, null));
        reviewService.create(second.buyer().getId(), request(second.items().get(0).getId(), 5, null));

        Product product = productRepository.findById(first.product().getId()).orElseThrow();
        assertThat(product.getRatingCount()).isEqualTo(2);
        assertThat(product.getRatingAvg()).isEqualTo(4.5);
    }

    @Test
    @DisplayName("Đơn chưa COMPLETED: báo REVIEW_ORDER_NOT_COMPLETED, không tạo review")
    void donChuaHoanTat() {
        Purchase purchase = createPurchase(OrderStatus.SHIPPING);

        assertThatThrownBy(() -> reviewService.create(purchase.buyer().getId(),
                request(purchase.items().get(0).getId(), 5, null)))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.REVIEW_ORDER_NOT_COMPLETED));

        assertThat(reviewRepository.count()).isZero();
        assertThat(productRepository.findById(purchase.product().getId()).orElseThrow().getRatingCount())
                .isZero();
    }

    @Test
    @DisplayName("Món hàng của người khác: báo REVIEW_NOT_ALLOWED")
    void khongDanhGiaDuocMonCuaNguoiKhac() {
        Purchase purchase = createPurchase(OrderStatus.COMPLETED);
        User attacker = createUser();

        assertThatThrownBy(() -> reviewService.create(attacker.getId(),
                request(purchase.items().get(0).getId(), 5, null)))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.REVIEW_NOT_ALLOWED));

        assertThat(reviewRepository.count()).isZero();
    }

    @Test
    @DisplayName("Cùng một order_item: chỉ đánh giá được 1 lần")
    void khongDanhGiaLaiCungMon() {
        Purchase purchase = createPurchase(OrderStatus.COMPLETED);
        int orderItemId = purchase.items().get(0).getId();
        reviewService.create(purchase.buyer().getId(), request(orderItemId, 5, null));

        assertThatThrownBy(() -> reviewService.create(purchase.buyer().getId(),
                request(orderItemId, 4, "Lần hai")))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.REVIEW_ALREADY_EXISTS));

        assertThat(reviewRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Cùng sản phẩm trong một đơn (2 biến thể): chỉ đánh giá 1 lần")
    void khongDanhGiaHaiBienTheCungSanPhamTrongMotDon() {
        User buyer = createUser();
        Shop shop = createShop(createUser());
        Product product = createProduct(shop);
        ProductVariant variantA = createVariant(product, 100_000L);
        ProductVariant variantB = createVariant(product, 120_000L);
        Purchase purchase = createPurchase(OrderStatus.COMPLETED, buyer, product, variantA, variantB);

        reviewService.create(buyer.getId(), request(purchase.items().get(0).getId(), 5, null));

        assertThatThrownBy(() -> reviewService.create(buyer.getId(),
                request(purchase.items().get(1).getId(), 4, null)))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.REVIEW_ALREADY_EXISTS));

        assertThat(reviewRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Eligibility: chưa mua, đơn chưa xong, đã đánh giá")
    void kiemTraDieuKienDanhGia() {
        Purchase completed = createPurchase(OrderStatus.COMPLETED);
        User stranger = createUser();

        ReviewEligibilityResponse notPurchased = reviewService.getEligibility(
                stranger.getId(), completed.product().getId());
        assertThat(notPurchased.canReview()).isFalse();
        assertThat(notPurchased.reason()).isEqualTo(ReviewService.REASON_NOT_PURCHASED);

        // Người mua chỉ có đơn PENDING của sản phẩm: chưa đủ điều kiện đánh giá
        User pendingBuyer = createUser();
        createPurchase(OrderStatus.PENDING, pendingBuyer, completed.product(),
                completed.variants().get(0));
        ReviewEligibilityResponse notCompleted = reviewService.getEligibility(
                pendingBuyer.getId(), completed.product().getId());
        assertThat(notCompleted.canReview()).isFalse();
        assertThat(notCompleted.reason()).isEqualTo(ReviewService.REASON_ORDER_NOT_COMPLETED);

        reviewService.create(completed.buyer().getId(),
                request(completed.items().get(0).getId(), 5, "Hài lòng"));
        ReviewEligibilityResponse reviewed = reviewService.getEligibility(
                completed.buyer().getId(), completed.product().getId());
        assertThat(reviewed.canReview()).isFalse();
        assertThat(reviewed.reason()).isEqualTo(ReviewService.REASON_ALREADY_REVIEWED);
        assertThat(reviewed.myReview()).isNotNull();
        assertThat(reviewed.myReview().rating()).isEqualTo(5);
    }

    @Test
    @DisplayName("Eligibility: đơn COMPLETED trả về đúng orderItemId để đánh giá")
    void eligibilityTraVeOrderItemId() {
        Purchase purchase = createPurchase(OrderStatus.COMPLETED);

        ReviewEligibilityResponse response = reviewService.getEligibility(
                purchase.buyer().getId(), purchase.product().getId());

        assertThat(response.canReview()).isTrue();
        assertThat(response.orderItemId()).isEqualTo(purchase.items().get(0).getId());
        assertThat(response.reason()).isNull();
        assertThat(response.myReview()).isNull();
    }

    @Test
    @DisplayName("Danh sách review: phân trang và trả tên người đánh giá")
    void danhSachReviewPhanTrang() {
        Purchase first = createPurchase(OrderStatus.COMPLETED);
        Purchase second = createPurchase(OrderStatus.COMPLETED,
                first.buyer(), first.product(), first.variants().get(0));
        reviewService.create(first.buyer().getId(), request(first.items().get(0).getId(), 5, "Một"));
        reviewService.create(second.buyer().getId(), request(second.items().get(0).getId(), 4, "Hai"));

        PageResponse<ReviewResponse> page1 = reviewService.listByProduct(
                first.product().getId(), 1, 1);
        PageResponse<ReviewResponse> page2 = reviewService.listByProduct(
                first.product().getId(), 2, 1);

        assertThat(page1.items()).hasSize(1);
        assertThat(page1.totalItems()).isEqualTo(2);
        assertThat(page1.totalPages()).isEqualTo(2);
        assertThat(page2.items()).hasSize(1);
        assertThat(page1.items().get(0).id()).isNotEqualTo(page2.items().get(0).id());
        assertThat(page1.items().get(0).userName()).isNotBlank();
    }

    // ------------------------------------------------------------------ helpers

    private User createUser() {
        int n = SEQ.incrementAndGet();
        return userRepository.save(User.builder()
                .email("review-user-" + n + "@test.local")
                .password("test-password")
                .firstName("An")
                .lastName("Nguyễn")
                .status(1)
                .isDelete(0)
                .admin(false)
                .build());
    }

    private Shop createShop(User owner) {
        int n = SEQ.incrementAndGet();
        return shopRepository.save(Shop.builder()
                .owner(owner)
                .name("Shop Review " + n)
                .status(ShopStatus.APPROVED)
                .build());
    }

    private Product createProduct(Shop shop) {
        int n = SEQ.incrementAndGet();
        Product product = new Product();
        product.setName("Sản phẩm review " + n);
        product.setShopId(String.valueOf(shop.getId()));
        product.setShopName(shop.getName());
        product.setStatus("ACTIVE");
        return productRepository.save(product);
    }

    private ProductVariant createVariant(Product product, long priceMinor) {
        int n = SEQ.incrementAndGet();
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku("REVIEW-SKU-" + n);
        variant.setAttributes(Map.of("color", "Đen"));
        variant.setPriceMinor(priceMinor);
        variant.setStockQuantity(10);
        return variantRepository.save(variant);
    }

    private Purchase createPurchase(OrderStatus status) {
        User buyer = createUser();
        Shop shop = createShop(createUser());
        Product product = createProduct(shop);
        ProductVariant variant = createVariant(product, 100_000L);
        return createPurchase(status, buyer, product, variant);
    }

    private Purchase createPurchase(OrderStatus status, User buyer, Product product,
                                    ProductVariant... variants) {
        int total = 100_000 * variants.length;
        CheckoutSession session = new CheckoutSession();
        session.setBuyer(buyer);
        session.setStatus(CheckoutStatus.PAID);
        session.setPaymentMethod(PaymentMethod.VNPAY);
        session.setTotalAmountMinor(total);
        sessionRepository.save(session);

        Order order = new Order();
        order.setCheckoutSession(session);
        order.setBuyer(buyer);
        order.setShopId(Integer.parseInt(product.getShopId()));
        order.setStatus(status);
        order.setShippingAddressSnapshot(Map.of("fullAddress", "123 Đường Test"));
        order.setSubtotalMinor(total);
        order.setShippingFeeMinor(0);
        order.setTotalMinor(total);
        for (ProductVariant variant : variants) {
            OrderItem item = new OrderItem();
            item.setVariantId(variant.getId());
            item.setProductNameSnapshot(product.getName());
            item.setVariantAttributesSnapshot(Map.of("color", "Đen"));
            item.setUnitPriceMinor(100_000);
            item.setQuantity(1);
            item.setSubtotalMinor(100_000);
            order.addItem(item);
        }
        orderRepository.save(order);
        return new Purchase(buyer, product, order, order.getItems(), List.of(variants));
    }

    private ReviewCreateRequest request(int orderItemId, int rating, String comment) {
        return ReviewCreateRequest.builder()
                .orderItemId(orderItemId)
                .rating(rating)
                .comment(comment)
                .build();
    }

    private record Purchase(User buyer, Product product, Order order,
                            List<OrderItem> items, List<ProductVariant> variants) {
    }
}
