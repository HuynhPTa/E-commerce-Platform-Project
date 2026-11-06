package com.ecommerce.service;

import com.ecommerce.dto.request.AddressRequest;
import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.response.CheckoutResponse;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.CheckoutStatus;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.Payment;
import com.ecommerce.entity.PaymentMethod;
import com.ecommerce.entity.PaymentStatus;
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
import com.ecommerce.repository.PaymentRepository;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("BuyerOrderService - đơn hàng của người mua")
class BuyerOrderServiceIntegrationTest {
    private static final String BUYER_A = "buyer-orders-a@test.local";
    private static final String BUYER_B = "buyer-orders-b@test.local";
    private static final String SELLER = "seller-orders@test.local";

    @Autowired
    private BuyerOrderService buyerOrderService;
    @Autowired
    private CheckoutService checkoutService;
    @Autowired
    private OrderLifecycleService orderLifecycleService;
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

    @BeforeEach
    void cleanDatabase() {
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        sessionRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Chỉ trả đơn của người mua hiện tại và lọc được theo trạng thái")
    void chiTraDonCuaNguoiMua() {
        int orderA = createOrder(BUYER_A);
        createOrder(BUYER_B);

        PageResponse<OrderSummaryResponse> all = buyerOrderService.list(BUYER_A, null, 1, 10);
        assertThat(all.totalItems()).isEqualTo(1);
        assertThat(all.items()).singleElement().satisfies(order -> {
            assertThat(order.id()).isEqualTo(orderA);
            assertThat(order.buyerEmail()).isEqualTo(BUYER_A);
        });

        PageResponse<OrderSummaryResponse> confirmed =
                buyerOrderService.list(BUYER_A, OrderStatus.CONFIRMED, 1, 10);
        assertThat(confirmed.items()).isEmpty();

        Order order = orderRepository.findById(orderA).orElseThrow();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        PageResponse<OrderSummaryResponse> after =
                buyerOrderService.list(BUYER_A, OrderStatus.CONFIRMED, 1, 10);
        assertThat(after.items()).singleElement()
                .satisfies(item -> assertThat(item.id()).isEqualTo(orderA));
    }

    @Test
    @DisplayName("Chi tiết trả đúng items/địa chỉ; đơn người khác trả 404")
    void chiTietVaPhanQuyen() {
        int orderA = createOrder(BUYER_A);
        int orderB = createOrder(BUYER_B);

        OrderDetailResponse detail = buyerOrderService.detail(BUYER_A, orderA);
        assertThat(detail.id()).isEqualTo(orderA);
        assertThat(detail.buyerEmail()).isEqualTo(BUYER_A);
        assertThat(detail.shopName()).isEqualTo("Shop Orders");
        assertThat(detail.items()).hasSize(1);
        assertThat(detail.shippingAddress()).containsEntry("recipientName", "Nguyễn Văn Test");

        assertThatThrownBy(() -> buyerOrderService.detail(BUYER_A, orderB))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.ORDER_NOT_EXISTED));
    }

    @Test
    @DisplayName("Sửa địa chỉ PENDING tính lại phí giao hàng, tổng phiên và giao dịch COD")
    void suaDiaChiTinhLaiPhiGiaoHang() {
        int orderId = createOrder(BUYER_A, PaymentMethod.COD);
        Order order = orderRepository.findById(orderId).orElseThrow();
        int sessionId = order.getCheckoutSession().getId();

        // Đơn 150.000đ ở Hồ Chí Minh: dưới ngưỡng nhưng miền Nam miễn phí.
        assertThat(order.getShippingFeeMinor()).isZero();

        AddressRequest haNoi = AddressRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("123 Đường Test, Quận Hoàn Kiếm")
                .province("Hà Nội")
                .build();
        OrderDetailResponse afterHaNoi = buyerOrderService.updateShipping(BUYER_A, orderId, haNoi);
        assertThat(afterHaNoi.shippingFeeMinor()).isEqualTo(20_000);
        assertThat(afterHaNoi.totalMinor()).isEqualTo(170_000);
        assertThat(afterHaNoi.shippingAddress()).containsEntry("province", "Hà Nội");
        assertThat(sessionRepository.findById(sessionId).orElseThrow().getTotalAmountMinor())
                .isEqualTo(170_000);
        assertThat(paymentRepository.findByCheckoutSession_Id(sessionId).orElseThrow().getAmountMinor())
                .isEqualTo(170_000);

        AddressRequest daNang = AddressRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("45 Đường Test, Quận Hải Châu")
                .province("Đà Nẵng")
                .build();
        OrderDetailResponse afterDaNang = buyerOrderService.updateShipping(BUYER_A, orderId, daNang);
        assertThat(afterDaNang.shippingFeeMinor()).isEqualTo(10_000);
        assertThat(afterDaNang.totalMinor()).isEqualTo(160_000);

        AddressRequest unsupported = AddressRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("1 Đường Không Tồn Tại")
                .province("Atlantis")
                .build();
        assertThatThrownBy(() -> buyerOrderService.updateShipping(BUYER_A, orderId, unsupported))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_INPUT));

        Order confirmed = orderRepository.findById(orderId).orElseThrow();
        confirmed.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(confirmed);
        assertThatThrownBy(() -> buyerOrderService.updateShipping(BUYER_A, orderId, haNoi))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION));
    }

    @Test
    @DisplayName("Huỷ đơn PENDING hoàn tồn kho; đơn đã thanh toán không cho tự huỷ")
    void huyDonHoanTonKhoVaChanDonDaThanhToan() {
        int orderId = createOrder(BUYER_A, PaymentMethod.COD);
        Order order = orderRepository.findDetailById(orderId).orElseThrow();
        int variantId = order.getItems().get(0).getVariantId();
        assertThat(variantRepository.findById(variantId).orElseThrow().getStockQuantity())
                .isEqualTo(4);

        OrderDetailResponse cancelled = buyerOrderService.cancel(BUYER_A, orderId);
        assertThat(cancelled.status()).isEqualTo("CANCELLED");
        assertThat(variantRepository.findById(variantId).orElseThrow().getStockQuantity())
                .isEqualTo(5);

        int paidOrderId = createOrder(BUYER_B, PaymentMethod.VNPAY);
        Order paidOrder = orderRepository.findById(paidOrderId).orElseThrow();
        Payment payment = new Payment();
        payment.setCheckoutSession(paidOrder.getCheckoutSession());
        payment.setProvider(PaymentMethod.VNPAY);
        payment.setAmountMinor(paidOrder.getTotalMinor());
        payment.setStatus(PaymentStatus.SUCCEEDED);
        paymentRepository.save(payment);

        assertThatThrownBy(() -> buyerOrderService.cancel(BUYER_B, paidOrderId))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.ORDER_ALREADY_PAID));
    }

    @Test
    @DisplayName("Huỷ một đơn trong phiên chuyển phí và cập nhật giao dịch chờ")
    void huyMotDonTinhLaiPhienVaGiaoDich() {
        int[] orderIds = createMultiShopOrder(BUYER_A, PaymentMethod.COD, "Hà Nội");
        int firstOrderId = Math.min(orderIds[0], orderIds[1]);
        int secondOrderId = Math.max(orderIds[0], orderIds[1]);
        Order first = orderRepository.findById(firstOrderId).orElseThrow();
        Order second = orderRepository.findById(secondOrderId).orElseThrow();
        int sessionId = first.getCheckoutSession().getId();

        // Đơn đầu tiên chịu 20.000đ phí giao hàng Hà Nội cho cả phiên.
        assertThat(first.getShippingFeeMinor()).isEqualTo(20_000);
        assertThat(first.getTotalMinor()).isEqualTo(170_000);
        assertThat(second.getShippingFeeMinor()).isZero();
        assertThat(second.getTotalMinor()).isEqualTo(150_000);
        assertThat(sessionRepository.findById(sessionId).orElseThrow().getTotalAmountMinor())
                .isEqualTo(320_000);
        assertThat(paymentRepository.findByCheckoutSession_Id(sessionId)
                .orElseThrow().getAmountMinor()).isEqualTo(320_000);

        buyerOrderService.cancel(BUYER_A, firstOrderId);

        // Đơn còn lại nhận phí giao hàng và phiên chỉ còn tính đơn này.
        Order remaining = orderRepository.findById(secondOrderId).orElseThrow();
        assertThat(remaining.getShippingFeeMinor()).isEqualTo(20_000);
        assertThat(remaining.getTotalMinor()).isEqualTo(170_000);
        assertThat(sessionRepository.findById(sessionId).orElseThrow().getTotalAmountMinor())
                .isEqualTo(170_000);
        assertThat(paymentRepository.findByCheckoutSession_Id(sessionId)
                .orElseThrow().getAmountMinor()).isEqualTo(170_000);

        buyerOrderService.cancel(BUYER_A, secondOrderId);

        assertThat(sessionRepository.findById(sessionId).orElseThrow().getStatus())
                .isEqualTo(CheckoutStatus.FAILED);
        assertThat(sessionRepository.findById(sessionId).orElseThrow().getTotalAmountMinor())
                .isZero();

        Payment cancelledPayment = paymentRepository
                .findByCheckoutSession_Id(sessionId).orElseThrow();
        assertThat(cancelledPayment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(cancelledPayment.getAmountMinor()).isZero();
    }

    @Test
    @DisplayName("Đơn đã giao giữ nguyên địa chỉ, phí và tổng lịch sử khi đơn khác đổi địa chỉ")
    void donDaGiaoGiuNguyenLichSu() {
        int[] orderIds = createMultiShopOrder(BUYER_A, PaymentMethod.COD, "Hà Nội");
        int deliveredOrderId = Math.min(orderIds[0], orderIds[1]);
        int pendingOrderId = Math.max(orderIds[0], orderIds[1]);
        int sessionId = orderRepository.findById(deliveredOrderId)
                .orElseThrow().getCheckoutSession().getId();

        orderLifecycleService.updateStatus(
                orderRepository.findDetailById(deliveredOrderId).orElseThrow(),
                OrderStatus.CONFIRMED);
        orderLifecycleService.updateStatus(
                orderRepository.findDetailById(deliveredOrderId).orElseThrow(),
                OrderStatus.SHIPPING);
        orderLifecycleService.updateStatus(
                orderRepository.findDetailById(deliveredOrderId).orElseThrow(),
                OrderStatus.DELIVERED);

        AddressRequest daNang = AddressRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("45 Đường Test, Quận Hải Châu")
                .province("Đà Nẵng")
                .build();
        buyerOrderService.updateShipping(BUYER_A, pendingOrderId, daNang);

        Order delivered = orderRepository.findDetailById(deliveredOrderId).orElseThrow();
        assertThat(delivered.getShippingAddressSnapshot())
                .containsEntry("province", "Hà Nội");
        assertThat(delivered.getShippingFeeMinor()).isEqualTo(20_000);
        assertThat(delivered.getTotalMinor()).isEqualTo(170_000);

        Order pending = orderRepository.findDetailById(pendingOrderId).orElseThrow();
        assertThat(pending.getShippingAddressSnapshot())
                .containsEntry("province", "Đà Nẵng");
        assertThat(pending.getShippingFeeMinor()).isZero();
        assertThat(pending.getTotalMinor()).isEqualTo(150_000);

        assertThat(sessionRepository.findById(sessionId).orElseThrow().getTotalAmountMinor())
                .as("tổng phiên vẫn gồm đơn đã giao và đơn còn chờ")
                .isEqualTo(320_000);
        assertThat(paymentRepository.findByCheckoutSession_Id(sessionId)
                .orElseThrow().getAmountMinor()).isEqualTo(320_000);
    }

    @Test
    @DisplayName("COD chỉ ghi nhận đã thu tiền khi đơn được giao")
    void codChiThuTienKhiGiaoDon() {
        int orderId = createOrder(BUYER_A, PaymentMethod.COD);
        Order order = orderRepository.findDetailById(orderId).orElseThrow();
        int sessionId = order.getCheckoutSession().getId();
        int totalMinor = order.getTotalMinor();

        orderLifecycleService.updateStatus(
                orderRepository.findDetailById(orderId).orElseThrow(),
                OrderStatus.CONFIRMED);
        orderLifecycleService.updateStatus(
                orderRepository.findDetailById(orderId).orElseThrow(),
                OrderStatus.SHIPPING);

        assertThat(sessionRepository.findById(sessionId).orElseThrow().getStatus())
                .isEqualTo(CheckoutStatus.PENDING);
        assertThat(paymentRepository.findByCheckoutSession_Id(sessionId).orElseThrow()
                .getStatus()).isEqualTo(PaymentStatus.PENDING);

        orderLifecycleService.updateStatus(
                orderRepository.findDetailById(orderId).orElseThrow(),
                OrderStatus.DELIVERED);

        assertThat(sessionRepository.findById(sessionId).orElseThrow().getStatus())
                .isEqualTo(CheckoutStatus.PAID);
        Payment collected = paymentRepository.findByCheckoutSession_Id(sessionId).orElseThrow();
        assertThat(collected.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
        assertThat(collected.getAmountMinor()).isEqualTo(totalMinor);
        assertThat(collected.getPaidAt()).isNotNull();
    }

    // ---------------------------------------------------------------- helpers

    private int createOrder(String buyerEmail) {
        return createOrder(buyerEmail, PaymentMethod.VNPAY);
    }

    private int createOrder(String buyerEmail, PaymentMethod paymentMethod) {
        User buyer = userRepository.save(user(buyerEmail, "Buyer"));
        Shop shop = createShop(SELLER, "Shop Orders");
        ProductVariant variant = createVariant(shop, "SKU-ORDER-" + buyer.getId(), 150_000L);

        CartItem cartItem = new CartItem();
        cartItem.setUser(buyer);
        cartItem.setVariant(variant);
        cartItem.setQuantity(1);
        cartRepository.save(cartItem);

        CheckoutRequest request = CheckoutRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("123 Đường Test, Phường 1, Quận 1, TP.HCM")
                .province("Hồ Chí Minh")
                .paymentMethod(paymentMethod)
                .cartItemIds(List.of(cartItem.getId()))
                .build();
        CheckoutResponse response = checkoutService.checkout(buyer.getId(), request);
        return response.getOrders().get(0).getOrderId();
    }

    private int[] createMultiShopOrder(String buyerEmail, PaymentMethod paymentMethod,
                                       String province) {
        User buyer = userRepository.save(user(buyerEmail, "Buyer"));
        Shop firstShop = createShop("seller-orders-1@test.local", "Shop Orders 1");
        Shop secondShop = createShop("seller-orders-2@test.local", "Shop Orders 2");
        ProductVariant firstVariant = createVariant(firstShop, "SKU-MULTI-1", 150_000L);
        ProductVariant secondVariant = createVariant(secondShop, "SKU-MULTI-2", 150_000L);

        CartItem firstItem = new CartItem();
        firstItem.setUser(buyer);
        firstItem.setVariant(firstVariant);
        firstItem.setQuantity(1);
        cartRepository.save(firstItem);

        CartItem secondItem = new CartItem();
        secondItem.setUser(buyer);
        secondItem.setVariant(secondVariant);
        secondItem.setQuantity(1);
        cartRepository.save(secondItem);

        CheckoutRequest request = CheckoutRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("123 Đường Test, Quận Hoàn Kiếm")
                .province(province)
                .paymentMethod(paymentMethod)
                .cartItemIds(List.of(firstItem.getId(), secondItem.getId()))
                .build();
        CheckoutResponse response = checkoutService.checkout(buyer.getId(), request);
        return response.getOrders().stream()
                .mapToInt(order -> order.getOrderId())
                .toArray();
    }

    private Shop createShop(String sellerEmail, String shopName) {
        User seller = userRepository.findByEmailAndIsDelete(sellerEmail, 0)
                .orElseGet(() -> userRepository.save(user(sellerEmail, "Seller")));
        return shopRepository.findByOwnerId(seller.getId())
                .orElseGet(() -> shopRepository.save(Shop.builder()
                        .owner(seller).name(shopName).status(ShopStatus.APPROVED).build()));
    }

    private ProductVariant createVariant(Shop shop, String sku, long priceMinor) {
        Product product = new Product();
        product.setName("Sản phẩm " + sku);
        product.setShopId(String.valueOf(shop.getId()));
        product.setShopName(shop.getName());
        product.setStatus("ACTIVE");
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku(sku);
        variant.setAttributes(new HashMap<>(Map.of("color", "Đen")));
        variant.setPriceMinor(priceMinor);
        variant.setStockQuantity(5);
        return variantRepository.save(variant);
    }

    private User user(String email, String firstName) {
        return User.builder()
                .email(email).password("test-password")
                .firstName(firstName).lastName("Test")
                .status(1).isDelete(0).admin(false).build();
    }
}
