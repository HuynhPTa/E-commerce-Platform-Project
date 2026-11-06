package com.ecommerce.service.payment;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.request.CreatePaymentRequest;
import com.ecommerce.dto.response.CheckoutResponse;
import com.ecommerce.dto.response.PaymentUrlResponse;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.CheckoutSession;
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
import com.ecommerce.service.BuyerOrderService;
import com.ecommerce.service.CheckoutService;
import com.ecommerce.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("PaymentService - tạo URL, callback/IPN và idempotency")
class PaymentServiceIntegrationTest {
    private static final String BUYER_EMAIL = "payment-buyer@test.local";
    private static final String OTHER_BUYER_EMAIL = "payment-other@test.local";
    private static final String SELLER_EMAIL = "payment-seller@test.local";

    @Autowired
    private PaymentService paymentService;
    @Autowired
    private CheckoutService checkoutService;
    @Autowired
    private BuyerOrderService buyerOrderService;
    @Autowired
    private VnPayProvider vnPayProvider;
    @Autowired
    private MomoProvider momoProvider;
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
    @DisplayName("Tạo URL VNPay có đủ tham số và chữ ký hợp lệ")
    void taoUrlVnPay() {
        Fixture fixture = createCheckout(PaymentMethod.VNPAY);

        PaymentUrlResponse response = paymentService.createPaymentUrl(BUYER_EMAIL,
                new CreatePaymentRequest(fixture.sessionId(), PaymentMethod.VNPAY), "127.0.0.1");

        assertThat(response.redirectUrl())
                .startsWith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?")
                .contains("vnp_SecureHash=");
        Map<String, String> params = parseQuery(response.redirectUrl());
        assertThat(params.get("vnp_Amount")).isEqualTo(String.valueOf(fixture.totalMinor() * 100L));
        assertThat(params.get("vnp_TxnRef")).startsWith("MH" + fixture.sessionId() + "T");

        PaymentCallback callback = vnPayProvider.verifyCallback(params);
        assertThat(callback.validSignature()).isTrue();
        assertThat(callback.checkoutSessionId()).isEqualTo(fixture.sessionId());
    }

    @Test
    @DisplayName("IPN thành công: PAID + CONFIRMED; gọi lặp không đổi trạng thái lần hai")
    void ipnThanhCongIdempotent() {
        Fixture fixture = createCheckout(PaymentMethod.VNPAY);
        Map<String, String> callback = signedVnPayCallback(fixture, true, null, null);

        PaymentService.PaymentResult first = paymentService.processVnPay(callback);
        assertThat(first.success()).isTrue();
        assertPaid(fixture);

        PaymentService.PaymentResult second = paymentService.processVnPay(callback);
        assertThat(second.success()).isTrue();
        assertPaid(fixture);
        assertThat(paymentRepository.count()).isEqualTo(1);
        assertThat(orderRepository.findById(fixture.orderId()).orElseThrow().getStatus())
                .isEqualTo(OrderStatus.CONFIRMED);
        assertThat(variantRepository.findById(fixture.variantId()).orElseThrow().getStockQuantity())
                .isEqualTo(3);
    }

    @Test
    @DisplayName("Chữ ký sai bị từ chối, không đổi trạng thái")
    void chuKySaiBiTuChoi() {
        Fixture fixture = createCheckout(PaymentMethod.VNPAY);
        Map<String, String> callback = signedVnPayCallback(fixture, true, null, null);
        callback.put("vnp_SecureHash", "deadbeef");

        assertThatThrownBy(() -> paymentService.processVnPay(callback))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.PAYMENT_INVALID_SIGNATURE));

        assertThat(sessionRepository.findById(fixture.sessionId()).orElseThrow().getStatus())
                .isEqualTo(CheckoutStatus.PENDING);
        assertThat(paymentRepository.findByCheckoutSession_Id(fixture.sessionId()).orElseThrow()
                .getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(orderRepository.findById(fixture.orderId()).orElseThrow().getStatus())
                .isEqualTo(OrderStatus.PENDING);
    }

    @Test
    @DisplayName("Số tiền callback khác số tiền phiên: từ chối và đánh dấu thất bại")
    void soTienSaiBiTuChoi() {
        Fixture fixture = createCheckout(PaymentMethod.VNPAY);
        Map<String, String> callback = signedVnPayCallback(fixture, true,
                String.valueOf(fixture.totalMinor() * 100L + 100), null);

        assertThatThrownBy(() -> paymentService.processVnPay(callback))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.PAYMENT_AMOUNT_MISMATCH));

        assertThat(sessionRepository.findById(fixture.sessionId()).orElseThrow().getStatus())
                .isEqualTo(CheckoutStatus.FAILED);
        assertThat(paymentRepository.findByCheckoutSession_Id(fixture.sessionId()).orElseThrow()
                .getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(orderRepository.findById(fixture.orderId()).orElseThrow().getStatus())
                .isEqualTo(OrderStatus.PENDING);
    }

    @Test
    @DisplayName("Người khác không tạo được URL cho phiên của mình")
    void khongTaoUrlChoNguoiKhac() {
        Fixture fixture = createCheckout(PaymentMethod.VNPAY);
        userRepository.save(user(OTHER_BUYER_EMAIL, "Other", "Buyer"));

        assertThatThrownBy(() -> paymentService.createPaymentUrl(OTHER_BUYER_EMAIL,
                new CreatePaymentRequest(fixture.sessionId(), PaymentMethod.VNPAY), "127.0.0.1"))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.CHECKOUT_SESSION_NOT_FOUND));
    }

    @Test
    @DisplayName("Cổng thanh toán phải khớp phương thức đã chọn khi checkout")
    void phuongThucKhongKhop() {
        Fixture fixture = createCheckout(PaymentMethod.VNPAY);

        assertThatThrownBy(() -> paymentService.createPaymentUrl(BUYER_EMAIL,
                new CreatePaymentRequest(fixture.sessionId(), PaymentMethod.MOMO), "127.0.0.1"))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.PAYMENT_METHOD_MISMATCH));
    }

    @Test
    @DisplayName("MoMo callback đúng chữ ký: PAID + CONFIRMED")
    void momoCallbackThanhCong() {
        Fixture fixture = createCheckout(PaymentMethod.MOMO);
        CheckoutSession session = sessionRepository.findById(fixture.sessionId()).orElseThrow();
        Payment payment = new Payment();
        payment.setCheckoutSession(session);
        payment.setProvider(PaymentMethod.MOMO);
        payment.setAmountMinor(session.getTotalAmountMinor());
        payment.setStatus(PaymentStatus.PENDING);
        paymentRepository.save(payment);

        Map<String, String> callback = new LinkedHashMap<>();
        callback.put("partnerCode", "TESTPARTNER");
        callback.put("orderId", PaymentReference.create(fixture.sessionId()));
        callback.put("requestId", "REQ-MOMO-1");
        callback.put("amount", String.valueOf(fixture.totalMinor()));
        callback.put("orderInfo", "Thanh toan don hang " + fixture.sessionId());
        callback.put("orderType", "momo_wallet");
        callback.put("payType", "qr");
        callback.put("responseTime", "1760000000000");
        callback.put("resultCode", "0");
        callback.put("message", "Success");
        callback.put("transId", "MOMO-TXN-1");
        callback.put("extraData", "");
        callback.put("signature", momoProvider.signCallback(callback));

        PaymentService.PaymentResult result = paymentService.processMomo(callback);
        assertThat(result.success()).isTrue();
        assertPaid(fixture);
        assertThat(paymentRepository.findByCheckoutSession_Id(fixture.sessionId()).orElseThrow()
                .getProviderTransactionId()).isEqualTo("MOMO-TXN-1");
    }

    @Test
    @DisplayName("Phiên đã huỷ hết đơn không tạo được URL thanh toán mới")
    void khongTaoUrlKhiMoiDonDaHuy() {
        Fixture fixture = createCheckout(PaymentMethod.VNPAY);
        buyerOrderService.cancel(BUYER_EMAIL, fixture.orderId());

        assertThatThrownBy(() -> paymentService.createPaymentUrl(BUYER_EMAIL,
                new CreatePaymentRequest(fixture.sessionId(), PaymentMethod.VNPAY), "127.0.0.1"))
                .isInstanceOfSatisfying(AppException.class,
                        ex -> assertThat(ex.getErrorCode())
                                .isEqualTo(ErrorCode.PAYMENT_SESSION_NOT_PAYABLE));

        assertThat(sessionRepository.findById(fixture.sessionId()).orElseThrow().getStatus())
                .isEqualTo(CheckoutStatus.FAILED);
        assertThat(sessionRepository.findById(fixture.sessionId()).orElseThrow()
                .getTotalAmountMinor()).isZero();
    }

    @Test
    @DisplayName("Tiền về sau khi mọi đơn đã huỷ: ghi nhận REFUND_REQUIRED, không báo sai số tiền")
    void callbackSauKhiHuyDonCanHoanTien() {
        Fixture fixture = createCheckout(PaymentMethod.VNPAY);
        // Tạo giao dịch và callback hợp lệ trước khi huỷ đơn.
        Map<String, String> callback = signedVnPayCallback(fixture, true, null, null);
        buyerOrderService.cancel(BUYER_EMAIL, fixture.orderId());

        PaymentService.PaymentResult result = paymentService.processVnPay(callback);
        assertThat(result.success()).isFalse();

        Payment refund = paymentRepository.findByCheckoutSession_Id(fixture.sessionId())
                .orElseThrow();
        assertThat(refund.getStatus()).isEqualTo(PaymentStatus.REFUND_REQUIRED);
        assertThat(refund.getAmountMinor()).isEqualTo(fixture.totalMinor());
        assertThat(refund.getProviderTransactionId()).isEqualTo("VNPAY-TXN-1");
        assertThat(refund.getPaidAt()).isNotNull();

        CheckoutSession session = sessionRepository.findById(fixture.sessionId()).orElseThrow();
        assertThat(session.getStatus()).isEqualTo(CheckoutStatus.FAILED);
        assertThat(session.getTotalAmountMinor()).isZero();
        assertThat(orderRepository.findById(fixture.orderId()).orElseThrow().getStatus())
                .isEqualTo(OrderStatus.CANCELLED);

        // Cổng thanh toán gọi lặp lại phải nhận cùng kết quả, không tạo giao dịch mới.
        PaymentService.PaymentResult repeated = paymentService.processVnPay(callback);
        assertThat(repeated.success()).isFalse();
        assertThat(paymentRepository.count()).isEqualTo(1);
        assertThat(paymentRepository.findByCheckoutSession_Id(fixture.sessionId())
                .orElseThrow().getStatus()).isEqualTo(PaymentStatus.REFUND_REQUIRED);
    }

    // ---------------------------------------------------------------- helpers

    private Map<String, String> signedVnPayCallback(Fixture fixture, boolean success,
                                                    String amountOverride, String hashOverride) {
        PaymentUrlResponse url = paymentService.createPaymentUrl(BUYER_EMAIL,
                new CreatePaymentRequest(fixture.sessionId(), PaymentMethod.VNPAY), "127.0.0.1");
        Map<String, String> callback = new HashMap<>(parseQuery(url.redirectUrl()));
        callback.put("vnp_ResponseCode", success ? "00" : "24");
        callback.put("vnp_TransactionStatus", success ? "00" : "02");
        callback.put("vnp_TransactionNo", "VNPAY-TXN-1");
        if (amountOverride != null) {
            callback.put("vnp_Amount", amountOverride);
        }
        callback.remove("vnp_SecureHash");
        callback.put("vnp_SecureHash", hashOverride != null ? hashOverride : vnPayProvider.sign(callback));
        return callback;
    }

    private void assertPaid(Fixture fixture) {
        assertThat(sessionRepository.findById(fixture.sessionId()).orElseThrow().getStatus())
                .isEqualTo(CheckoutStatus.PAID);
        assertThat(paymentRepository.findByCheckoutSession_Id(fixture.sessionId()).orElseThrow()
                .getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
        assertThat(orderRepository.findById(fixture.orderId()).orElseThrow().getStatus())
                .isEqualTo(OrderStatus.CONFIRMED);
    }

    private Fixture createCheckout(PaymentMethod method) {
        User buyer = userRepository.save(user(BUYER_EMAIL, "Payment", "Buyer"));
        User seller = userRepository.save(user(SELLER_EMAIL, "Payment", "Seller"));
        Shop shop = shopRepository.save(Shop.builder()
                .owner(seller).name("Shop Payment").status(ShopStatus.APPROVED).build());
        Product product = new Product();
        product.setName("Sản phẩm thanh toán");
        product.setShopId(String.valueOf(shop.getId()));
        product.setShopName(shop.getName());
        product.setStatus("ACTIVE");
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku("SKU-PAYMENT");
        variant.setAttributes(new HashMap<>(Map.of("color", "Đen")));
        variant.setPriceMinor(250_000L);
        variant.setStockQuantity(5);
        variantRepository.save(variant);

        CartItem cartItem = new CartItem();
        cartItem.setUser(buyer);
        cartItem.setVariant(variant);
        cartItem.setQuantity(2);
        cartRepository.save(cartItem);

        CheckoutRequest request = CheckoutRequest.builder()
                .recipientName("Nguyễn Văn Test")
                .phone("0901234567")
                .fullAddress("123 Đường Test, Phường 1, Quận 1, TP.HCM")
                .province("Hồ Chí Minh")
                .paymentMethod(method)
                .cartItemIds(List.of(cartItem.getId()))
                .build();
        CheckoutResponse checkout = checkoutService.checkout(buyer.getId(), request);
        return new Fixture(checkout.getCheckoutSessionId(),
                checkout.getOrders().get(0).getOrderId(), variant.getId(),
                checkout.getTotalAmountMinor());
    }

    private User user(String email, String firstName, String lastName) {
        return User.builder()
                .email(email).password("test-password")
                .firstName(firstName).lastName(lastName)
                .status(1).isDelete(0).admin(false).build();
    }

    private Map<String, String> parseQuery(String url) {
        Map<String, String> result = new LinkedHashMap<>();
        String query = URI.create(url).getRawQuery();
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);
            result.put(URLDecoder.decode(parts[0], StandardCharsets.UTF_8),
                    parts.length == 2 ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8) : "");
        }
        return result;
    }

    private record Fixture(int sessionId, int orderId, int variantId, int totalMinor) {
    }
}
