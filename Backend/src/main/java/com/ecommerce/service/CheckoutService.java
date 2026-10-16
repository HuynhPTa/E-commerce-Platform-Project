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

        // 2. Trừ kho nguyên tử. Sắp xếp theo variantId để các giao dịch đồng thời
        //    khóa dòng theo cùng thứ tự -> tránh deadlock.
        lines.stream()
                .sorted(Comparator.comparingInt(CartLine::variantId))
                .forEach(line -> {
                    if (!cartRepository.decreaseStock(line.variantId(), line.quantity())) {
                        throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
                    }
                });

        // 3. Tạo checkout_session (điểm neo cho 1 lượt thanh toán)
        User buyer = entityManager.getReference(User.class, buyerId);
        long total = lines.stream().mapToLong(l -> (long) l.unitPriceMinor() * l.quantity()).sum();

        CheckoutSession session = new CheckoutSession();
        session.setBuyer(buyer);
        session.setStatus(CheckoutStatus.PENDING);
        session.setPaymentMethod(request.getPaymentMethod());
        session.setTotalAmountMinor(Math.toIntExact(total));
        sessionRepository.save(session);

        // 4. Nhóm theo shop_id -> mỗi shop 1 order
        Map<Integer, List<CartLine>> byShop = lines.stream()
                .collect(Collectors.groupingBy(CartLine::shopId, LinkedHashMap::new, Collectors.toList()));

        List<Order> orders = new ArrayList<>();
        for (Map.Entry<Integer, List<CartLine>> entry : byShop.entrySet()) {
            Order order = new Order();
            order.setCheckoutSession(session);
            order.setBuyer(buyer);
            order.setShopId(entry.getKey());
            order.setStatus(OrderStatus.PENDING);
            order.setShippingAddressSnapshot(buildAddressSnapshot(request));

            int subtotal = 0;
            for (CartLine line : entry.getValue()) {
                int lineTotal = Math.multiplyExact(line.unitPriceMinor(), line.quantity());
                OrderItem item = new OrderItem();
                item.setVariantId(line.variantId());
                item.setProductNameSnapshot(line.productName());
                item.setVariantAttributesSnapshot(parseAttributes(line.attributesJson()));
                item.setUnitPriceMinor(line.unitPriceMinor());
                item.setQuantity(line.quantity());
                item.setSubtotalMinor(lineTotal);
                order.addItem(item);
                subtotal = Math.addExact(subtotal, lineTotal);
            }
            order.setSubtotalMinor(subtotal);
            order.setShippingFeeMinor(0);
            order.setTotalMinor(subtotal);
            orderRepository.save(order);
            orders.add(order);
        }

        // 5. Xóa các món đã đặt khỏi giỏ
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
        if (lines.isEmpty()) {
            throw new AppException(ErrorCode.CART_EMPTY);
        }
        if (requestedIds != null && !requestedIds.isEmpty()
                && lines.size() != new HashSet<>(requestedIds).size()) {
            throw new AppException(ErrorCode.INVALID_CART_ITEM);
        }
        lines.stream()
                .filter(l -> !"ACTIVE".equals(l.productStatus()))
                .findFirst()
                .ifPresent(l -> {
                    throw new AppException(ErrorCode.PRODUCT_NOT_AVAILABLE);
                });
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