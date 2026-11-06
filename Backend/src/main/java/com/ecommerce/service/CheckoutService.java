package com.ecommerce.service;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.response.CheckoutResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.CheckoutCartRepository;
import com.ecommerce.repository.CheckoutCartRepository.CartLine;
import com.ecommerce.repository.CheckoutSessionRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.util.ShippingPolicy;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final CheckoutCartRepository cartRepository;
    private final CheckoutSessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ShopRepository shopRepository;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    /**
     * 1 giỏ hàng (N shop) -> 1 checkout_session + N orders + order_items.
     * Mọi thứ nằm trong 1 transaction: bất kỳ lỗi nào (vd hết hàng) đều rollback toàn bộ,
     * kể cả kho đã trừ trước đó.
     */
    @Transactional
    public CheckoutResponse checkout(int buyerId, CheckoutRequest request) {
        // 0. Khoá dòng người dùng để hai lần bấm đặt hàng đồng thời không cùng đọc giỏ.
        User buyer = entityManager.find(User.class, buyerId, LockModeType.PESSIMISTIC_WRITE);
        if (buyer == null) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        // 0b. Nếu client gửi lại cùng khoá (mất mạng, bấm đúp) thì trả phiên đã tạo.
        String idempotencyKey = request.getIdempotencyKey();
        if (idempotencyKey != null && idempotencyKey.isBlank() == false) {
            CheckoutSession existing = sessionRepository
                    .findByBuyer_IdAndIdempotencyKey(buyerId, idempotencyKey.trim())
                    .orElse(null);
            if (existing != null) {
                return toResponse(existing,
                        orderRepository.findByCheckoutSession_Id(existing.getId()));
            }
        }

        // 1. Đọc giỏ hàng + giá + shop từ DB (không tin client)
        List<CartLine> lines = cartRepository.findLines(buyerId, request.getCartItemIds());
        validateLines(lines, request.getCartItemIds());
        validateShops(lines);

        // 2. Nhóm theo shop + tính tiền TRƯỚC khi ghi DB.
        //    Tiền lưu bằng int (đồng) nên phải chặn tràn số thay vì để ArithmeticException -> 500.
        Map<Integer, List<CartLine>> byShop = lines.stream()
                .collect(Collectors.groupingBy(CartLine::shopId, LinkedHashMap::new, Collectors.toList()));

        Map<Integer, Integer> subtotals = new LinkedHashMap<>();
        long total = 0;
        for (Map.Entry<Integer, List<CartLine>> entry : byShop.entrySet()) {
            long subtotal = 0;
            for (CartLine line : entry.getValue()) {
                subtotal = addAmount(subtotal, lineTotal(line));
            }
            int subtotalMinor = toAmountMinor(subtotal);
            subtotals.put(entry.getKey(), subtotalMinor);
            total = addAmount(total, subtotalMinor);
        }
        int totalMinor = toAmountMinor(total);

        // 2b. Tính phí vận chuyển theo tỉnh/thành và ngưỡng miễn phí toàn quốc.
        if (ShippingPolicy.isSupported(request.getProvince()) == false) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        int shippingFeeMinor = ShippingPolicy.feeFor(request.getProvince(), totalMinor);
        int grandTotalMinor = toAmountMinor(addAmount(totalMinor, shippingFeeMinor));

        // 3. Trừ kho nguyên tử. Sắp xếp theo variantId để các giao dịch đồng thời
        //    khóa dòng theo cùng thứ tự -> tránh deadlock.
        lines.stream()
                .sorted(Comparator.comparingInt(CartLine::variantId))
                .forEach(line -> {
                    if (!cartRepository.decreaseStock(line.variantId(), line.quantity())) {
                        throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
                    }
                });

        // 4. Tạo checkout_session (điểm neo cho 1 lượt thanh toán)
        CheckoutSession session = new CheckoutSession();
        session.setBuyer(buyer);
        session.setStatus(CheckoutStatus.PENDING);
        session.setPaymentMethod(request.getPaymentMethod());
        session.setTotalAmountMinor(grandTotalMinor);
        session.setIdempotencyKey(normalizeIdempotencyKey(idempotencyKey));
        sessionRepository.save(session);

        // 4b. Đơn COD có sẵn giao dịch chờ thu tiền khi giao hàng.
        if (request.getPaymentMethod() == PaymentMethod.COD) {
            Payment payment = new Payment();
            payment.setCheckoutSession(session);
            payment.setProvider(PaymentMethod.COD);
            payment.setAmountMinor(grandTotalMinor);
            payment.setStatus(PaymentStatus.PENDING);
            paymentRepository.save(payment);
        }

        // 5. Mỗi shop 1 order. Phí vận chuyển gán cho đơn đầu tiên để tổng các đơn khớp phiên.
        List<Order> orders = new ArrayList<>();
        for (Map.Entry<Integer, List<CartLine>> entry : byShop.entrySet()) {
            Order order = new Order();
            order.setCheckoutSession(session);
            order.setBuyer(buyer);
            order.setShopId(entry.getKey());
            order.setStatus(OrderStatus.PENDING);
            order.setShippingAddressSnapshot(buildAddressSnapshot(request));

            for (CartLine line : entry.getValue()) {
                OrderItem item = new OrderItem();
                item.setVariantId(line.variantId());
                item.setProductNameSnapshot(line.productName());
                item.setVariantAttributesSnapshot(parseAttributes(line.attributesJson()));
                item.setUnitPriceMinor(toAmountMinor(line.unitPriceMinor()));
                item.setQuantity(line.quantity());
                item.setSubtotalMinor(toAmountMinor(lineTotal(line)));
                order.addItem(item);
            }
            int subtotal = subtotals.get(entry.getKey());
            int orderShippingFee = 0;
            if (orders.isEmpty()) {
                orderShippingFee = shippingFeeMinor;
            }
            order.setSubtotalMinor(subtotal);
            order.setShippingFeeMinor(orderShippingFee);
            order.setTotalMinor(toAmountMinor(addAmount(subtotal, orderShippingFee)));
            orderRepository.save(order);
            orders.add(order);
        }

        // 6. Xóa các món đã đặt khỏi giỏ
        cartRepository.deleteCartItems(buyerId,
                lines.stream().map(CartLine::cartItemId).toList());

        return toResponse(session, orders);
    }

    /** Dùng cho trang /payment/return: đọc kết quả thật từ server. */
    @Transactional(readOnly = true)
    public CheckoutResponse getResult(int buyerId, int checkoutSessionId) {
        CheckoutSession session = sessionRepository.findById(checkoutSessionId)
                .orElseThrow(() -> new AppException(ErrorCode.CHECKOUT_SESSION_NOT_FOUND));

        // Người khác truy cập cũng trả lỗi không tìm thấy để không lộ sự tồn tại của phiên
        if (session.getBuyer().getId() != buyerId) {
            throw new AppException(ErrorCode.CHECKOUT_SESSION_NOT_FOUND);
        }
        return toResponse(session, orderRepository.findByCheckoutSession_Id(checkoutSessionId));
    }

    // ---------------------------------------------------------------- helpers

    /** Chuẩn hoá khoá chống trùng; khoá rỗng được coi như không gửi. */
    private static String normalizeIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null) {
            return null;
        }
        String normalized = idempotencyKey.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > 64) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        return normalized;
    }

    private void validateLines(List<CartLine> lines, List<Integer> requestedIds) {
        // cartItemIds lạ (của người khác / đã bị xóa) phải báo INVALID_CART_ITEM,
        // kể cả khi giỏ lọc ra rỗng — kiểm tra trước CART_EMPTY.
        if (requestedIds != null && !requestedIds.isEmpty()
                && lines.size() != new HashSet<>(requestedIds).size()) {
            throw new AppException(ErrorCode.INVALID_CART_ITEM);
        }
        if (lines.isEmpty()) {
            throw new AppException(ErrorCode.CART_EMPTY);
        }
        for (CartLine line : lines) {
            // Dữ liệu giỏ hỏng (quantity/price <= 0) không được tạo đơn 0 đồng.
            if (line.quantity() < 1 || line.unitPriceMinor() <= 0) {
                throw new AppException(ErrorCode.INVALID_CART_ITEM);
            }
            if (!"ACTIVE".equalsIgnoreCase(line.productStatus())) {
                throw new AppException(ErrorCode.PRODUCT_NOT_AVAILABLE);
            }
        }
    }

    /** Shop phải tồn tại và đã được Admin duyệt thì sản phẩm mới được bán. */
    private void validateShops(List<CartLine> lines) {
        Set<Integer> shopIds = lines.stream().map(CartLine::shopId).collect(Collectors.toSet());
        List<Shop> shops = shopRepository.findAllById(shopIds);
        boolean allApproved = shops.size() == shopIds.size()
                && shops.stream().allMatch(shop -> shop.getStatus() == ShopStatus.APPROVED);
        if (!allApproved) {
            throw new AppException(ErrorCode.SHOP_NOT_AVAILABLE);
        }
    }

    private long lineTotal(CartLine line) {
        try {
            return Math.multiplyExact(line.unitPriceMinor(), (long) line.quantity());
        } catch (ArithmeticException ex) {
            throw new AppException(ErrorCode.CHECKOUT_TOTAL_TOO_LARGE);
        }
    }

    private long addAmount(long a, long b) {
        try {
            return Math.addExact(a, b);
        } catch (ArithmeticException ex) {
            throw new AppException(ErrorCode.CHECKOUT_TOTAL_TOO_LARGE);
        }
    }

    private int toAmountMinor(long amount) {
        if (amount < 0 || amount > Integer.MAX_VALUE) {
            throw new AppException(ErrorCode.CHECKOUT_TOTAL_TOO_LARGE);
        }
        return (int) amount;
    }

    private Map<String, Object> buildAddressSnapshot(CheckoutRequest request) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("recipientName", request.getRecipientName() != null ? request.getRecipientName().trim() : null);
        snapshot.put("phone", request.getPhone());
        snapshot.put("fullAddress", request.getFullAddress() != null ? request.getFullAddress().trim() : null);
        snapshot.put("province", request.getProvince() != null ? request.getProvince().trim() : null);
        return snapshot;
    }

    private Map<String, Object> parseAttributes(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Thuộc tính biến thể không phải JSON hợp lệ: " + json, e);
        }
    }

    private CheckoutResponse toResponse(CheckoutSession session, List<Order> orders) {
        return CheckoutResponse.builder()
                .checkoutSessionId(session.getId())
                .status(session.getStatus().name())
                .paymentMethod(session.getPaymentMethod().name())
                .paymentStatus(paymentRepository.findByCheckoutSession_Id(session.getId())
                        .map(payment -> payment.getStatus().name()).orElse(null))
                .totalAmountMinor(session.getTotalAmountMinor())
                .orders(orders.stream().map(o -> CheckoutResponse.OrderSummary.builder()
                        .orderId(o.getId())
                        .shopId(o.getShopId())
                        .status(o.getStatus().name())
                        .itemCount(o.getItems().size())
                        .subtotalMinor(o.getSubtotalMinor())
                        .totalMinor(o.getTotalMinor())
                        .build()).toList())
                .build();
    }
}