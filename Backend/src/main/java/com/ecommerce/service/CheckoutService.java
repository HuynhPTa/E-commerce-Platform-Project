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
import com.ecommerce.repository.ShopRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
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
        User buyer = entityManager.getReference(User.class, buyerId);
        CheckoutSession session = new CheckoutSession();
        session.setBuyer(buyer);
        session.setStatus(CheckoutStatus.PENDING);
        session.setPaymentMethod(request.getPaymentMethod());
        session.setTotalAmountMinor(totalMinor);
        sessionRepository.save(session);

        // 5. Mỗi shop 1 order
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
            order.setSubtotalMinor(subtotal);
            order.setShippingFeeMinor(0);
            order.setTotalMinor(subtotal);
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