package com.ecommerce.service;

import com.ecommerce.dto.request.AddressRequest;
import com.ecommerce.entity.CheckoutSession;
import com.ecommerce.entity.CheckoutStatus;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.Payment;
import com.ecommerce.entity.PaymentMethod;
import com.ecommerce.entity.PaymentStatus;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.CheckoutSessionRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.util.ShippingPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Xử lý vòng đời đơn hàng trong một phiên thanh toán.
 *
 * Mọi thao tác thay đổi trạng thái/địa chỉ/tiền của đơn đều khoá phiên cha trước,
 * sau đó mới khoá đơn. Nhờ vậy hai request đồng thời trên cùng phiên không thể
 * cùng trả kho hoặc cùng ghi đè tổng tiền.
 */
@Service
@RequiredArgsConstructor
public class OrderLifecycleService {

    private final CheckoutSessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductVariantRepository variantRepository;

    /** Admin/Seller chuyển trạng thái theo luồng bán hàng. */
    @Transactional
    public Order updateStatus(Order order, OrderStatus next) {
        if (next == null) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        LockedOrder locked = lockSessionAndOrder(order);
        Order current = locked.order();
        if (current.getStatus().canSellerMoveTo(next) == false) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        if (next == OrderStatus.CANCELLED) {
            cancelLocked(locked.session(), current);
            return current;
        }

        current.setStatus(next);
        if (next == OrderStatus.COMPLETED && current.getCompletedAt() == null) {
            current.setCompletedAt(LocalDateTime.now());
        }
        orderRepository.save(current);

        if (next == OrderStatus.DELIVERED || next == OrderStatus.COMPLETED) {
            settleCodIfDelivered(locked.session());
        }
        return current;
    }

    /** Người mua tự huỷ khi đơn chưa bàn giao vận chuyển. */
    @Transactional
    public Order cancelByBuyer(Order order) {
        LockedOrder locked = lockSessionAndOrder(order);
        Order current = locked.order();

        if (current.getStatus() != OrderStatus.PENDING
                && current.getStatus() != OrderStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        cancelLocked(locked.session(), current);
        return current;
    }

    /** Người mua sửa địa chỉ nhận hàng khi đơn còn PENDING. */
    @Transactional
    public Order updateShipping(Order order, AddressRequest request) {
        LockedOrder locked = lockSessionAndOrder(order);
        Order current = locked.order();

        if (current.getStatus() != OrderStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        if (ShippingPolicy.isSupported(request.getProvince()) == false) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("recipientName", request.getRecipientName().trim());
        snapshot.put("phone", request.getPhone().trim());
        snapshot.put("fullAddress", request.getFullAddress().trim());
        snapshot.put("province", ShippingPolicy.normalize(request.getProvince()));

        List<Order> sessionOrders =
                orderRepository.findByCheckoutSession_Id(locked.session().getId());
        List<Order> active = activeOrders(sessionOrders);

        // Địa chỉ dùng chung cho các đơn chưa bàn giao; đơn đã giao/đã huỷ giữ nguyên lịch sử.
        for (Order sessionOrder : sessionOrders) {
            if (sessionOrder.getStatus() == OrderStatus.PENDING
                    || sessionOrder.getStatus() == OrderStatus.CONFIRMED) {
                sessionOrder.setShippingAddressSnapshot(snapshot);
                orderRepository.save(sessionOrder);
            }
        }

        if (allMutable(active)) {
            // Chỉ tính lại phí khi toàn bộ đơn còn hiệu lực đều có thể sửa địa chỉ.
            recalculateMutableOrders(locked.session(), active,
                    ShippingPolicy.normalize(request.getProvince()));
        } else {
            // Đã có đơn đang giao/đã giao: không đụng vào phí và tổng lịch sử.
            int sessionTotal = sumTotals(active);
            locked.session().setTotalAmountMinor(sessionTotal);
            sessionRepository.save(locked.session());
            syncPaymentAmount(locked.session(), sessionTotal);
        }

        return current;
    }

    /**
     * Huỷ các đơn chưa thanh toán của một phiên online đã quá hạn.
     * Trả kho, đưa phiên về EXPIRED và giao dịch về FAILED với số tiền 0.
     */
    @Transactional
    public void expireSession(int sessionId, LocalDateTime cutoff) {
        CheckoutSession session = sessionRepository.findByIdForUpdate(sessionId).orElse(null);
        if (session == null) {
            return;
        }
        if (session.getStatus() != CheckoutStatus.PENDING
                && session.getStatus() != CheckoutStatus.FAILED) {
            return;
        }
        if (session.getPaymentMethod() == PaymentMethod.COD) {
            return;
        }
        if (session.getCreatedAt() != null && session.getCreatedAt().isAfter(cutoff)) {
            return;
        }

        Payment payment = paymentRepository.findByCheckoutSession_Id(session.getId()).orElse(null);
        if (payment != null && payment.getStatus() == PaymentStatus.SUCCEEDED) {
            return;
        }
        // Tiền đã vào nhưng đơn đã huỷ: giữ nguyên trạng thái để còn xử lý hoàn tiền.
        if (payment != null && payment.getStatus() == PaymentStatus.REFUND_REQUIRED) {
            return;
        }

        List<Order> sessionOrders =
                orderRepository.findByCheckoutSession_Id(session.getId());
        for (Order sessionOrder : sessionOrders) {
            if (sessionOrder.getStatus() != OrderStatus.PENDING
                    && sessionOrder.getStatus() != OrderStatus.CONFIRMED
                    && sessionOrder.getStatus() != OrderStatus.CANCELLED) {
                // Đơn đã giao/đang giao thì không được huỷ tự động.
                return;
            }
        }

        for (Order sessionOrder : sessionOrders) {
            if (sessionOrder.getStatus() == OrderStatus.CANCELLED) {
                continue;
            }
            for (OrderItem item : sessionOrder.getItems()) {
                variantRepository.increaseStock(item.getVariantId(), item.getQuantity());
            }
            sessionOrder.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(sessionOrder);
        }

        session.setTotalAmountMinor(0);
        session.setStatus(CheckoutStatus.EXPIRED);
        sessionRepository.save(session);

        if (payment != null
                && payment.getStatus() != PaymentStatus.SUCCEEDED
                && payment.getStatus() != PaymentStatus.REFUND_REQUIRED) {
            payment.setAmountMinor(0);
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
    }

    private LockedOrder lockSessionAndOrder(Order order) {
        int sessionId = order.getCheckoutSession().getId();
        CheckoutSession session = sessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.CHECKOUT_SESSION_NOT_FOUND));
        Order current = orderRepository.findDetailByIdForUpdate(order.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        if (current.getCheckoutSession().getId() != sessionId) {
            throw new AppException(ErrorCode.ORDER_NOT_EXISTED);
        }
        return new LockedOrder(session, current);
    }

    private void cancelLocked(CheckoutSession session, Order order) {
        Payment payment = paymentRepository.findByCheckoutSession_Id(session.getId()).orElse(null);

        // Đơn online đã thu tiền không được huỷ âm thầm; cần hoàn tiền ngoài luồng.
        if (payment != null
                && payment.getStatus() == PaymentStatus.SUCCEEDED
                && session.getPaymentMethod() != PaymentMethod.COD) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
        }

        int releasedShippingFee = order.getShippingFeeMinor();

        for (OrderItem item : order.getItems()) {
            variantRepository.increaseStock(item.getVariantId(), item.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        List<Order> sessionOrders =
                orderRepository.findByCheckoutSession_Id(session.getId());
        reconcileAfterCancellation(session, sessionOrders, releasedShippingFee);
    }

    private void reconcileAfterCancellation(CheckoutSession session, List<Order> sessionOrders,
                                            int releasedShippingFee) {
        List<Order> active = activeOrders(sessionOrders);

        if (active.isEmpty()) {
            session.setTotalAmountMinor(0);
            if (session.getStatus() != CheckoutStatus.PAID) {
                session.setStatus(CheckoutStatus.FAILED);
            }
            sessionRepository.save(session);

            Payment payment = paymentRepository
                    .findByCheckoutSession_Id(session.getId()).orElse(null);
            if (payment != null
                    && payment.getStatus() != PaymentStatus.SUCCEEDED
                    && payment.getStatus() != PaymentStatus.REFUND_REQUIRED) {
                payment.setAmountMinor(0);
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }
            return;
        }

        if (allMutable(active)) {
            // Đơn đầu tiên còn hiệu lực chịu phí; phí tính lại theo địa chỉ hiện tại.
            recalculateMutableOrders(session, active, provinceOf(active.get(0)));
        } else {
            // Có đơn đã giao/đang giao: giữ nguyên phí lịch sử, chỉ chuyển phí
            // của đơn bị huỷ sang đơn còn hiệu lực đầu tiên để không mất phí.
            if (releasedShippingFee > 0) {
                Order carrier = lowestId(active);
                int carrierFee = carrier.getShippingFeeMinor() + releasedShippingFee;
                carrier.setShippingFeeMinor(carrierFee);
                carrier.setTotalMinor(carrier.getSubtotalMinor() + carrierFee);
                orderRepository.save(carrier);
            }
            int sessionTotal = sumTotals(active);
            session.setTotalAmountMinor(sessionTotal);
            sessionRepository.save(session);
            syncPaymentAmount(session, sessionTotal);
        }

        settleCodIfDelivered(session);
    }

    private void recalculateMutableOrders(CheckoutSession session, List<Order> active,
                                          String province) {
        Order carrier = lowestId(active);
        int subtotal = 0;
        for (Order order : active) {
            subtotal = subtotal + order.getSubtotalMinor();
        }
        int shippingFee = ShippingPolicy.feeFor(province, subtotal);

        for (Order order : active) {
            int orderFee = 0;
            if (order.getId() == carrier.getId()) {
                orderFee = shippingFee;
            }
            order.setShippingFeeMinor(orderFee);
            order.setTotalMinor(order.getSubtotalMinor() + orderFee);
            orderRepository.save(order);
        }

        int sessionTotal = subtotal + shippingFee;
        session.setTotalAmountMinor(sessionTotal);
        sessionRepository.save(session);
        syncPaymentAmount(session, sessionTotal);
    }

    private void syncPaymentAmount(CheckoutSession session, int total) {
        Payment payment = paymentRepository
                .findByCheckoutSession_Id(session.getId()).orElse(null);
        if (payment == null) {
            return;
        }
        if (payment.getStatus() == PaymentStatus.SUCCEEDED
                || payment.getStatus() == PaymentStatus.REFUND_REQUIRED) {
            return;
        }
        payment.setAmountMinor(total);
        paymentRepository.save(payment);
    }

    /** COD chỉ được coi là đã thu tiền khi mọi đơn còn hiệu lực đã giao/hoàn tất. */
    private void settleCodIfDelivered(CheckoutSession session) {
        if (session.getPaymentMethod() != PaymentMethod.COD) {
            return;
        }
        if (session.getStatus() == CheckoutStatus.PAID) {
            return;
        }

        int collectedAmountMinor = 0;
        boolean hasActiveOrder = false;
        for (Order sessionOrder
                : orderRepository.findByCheckoutSession_Id(session.getId())) {
            if (sessionOrder.getStatus() == OrderStatus.CANCELLED) {
                continue;
            }
            if (sessionOrder.getStatus() != OrderStatus.DELIVERED
                    && sessionOrder.getStatus() != OrderStatus.COMPLETED) {
                return;
            }
            hasActiveOrder = true;
            collectedAmountMinor = collectedAmountMinor + sessionOrder.getTotalMinor();
        }
        if (hasActiveOrder == false) {
            return;
        }

        Payment payment = paymentRepository
                .findByCheckoutSession_Id(session.getId()).orElse(null);
        if (payment == null) {
            payment = new Payment();
            payment.setCheckoutSession(session);
            payment.setProvider(PaymentMethod.COD);
        }
        payment.setAmountMinor(collectedAmountMinor);
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        session.setTotalAmountMinor(collectedAmountMinor);
        session.setStatus(CheckoutStatus.PAID);
        sessionRepository.save(session);
    }

    private static List<Order> activeOrders(List<Order> sessionOrders) {
        List<Order> active = new ArrayList<>();
        for (Order order : sessionOrders) {
            if (order.getStatus() != OrderStatus.CANCELLED) {
                active.add(order);
            }
        }
        return active;
    }

    private static boolean allMutable(List<Order> active) {
        if (active.isEmpty()) {
            return false;
        }
        for (Order order : active) {
            if (order.getStatus() != OrderStatus.PENDING
                    && order.getStatus() != OrderStatus.CONFIRMED) {
                return false;
            }
        }
        return true;
    }

    private static Order lowestId(List<Order> orders) {
        Order lowest = orders.get(0);
        for (Order order : orders) {
            if (order.getId() < lowest.getId()) {
                lowest = order;
            }
        }
        return lowest;
    }

    private static int sumTotals(List<Order> orders) {
        int total = 0;
        for (Order order : orders) {
            total = total + order.getTotalMinor();
        }
        return total;
    }

    private static String provinceOf(Order order) {
        Map<String, Object> snapshot = order.getShippingAddressSnapshot();
        if (snapshot == null) {
            return null;
        }
        Object province = snapshot.get("province");
        if (province == null) {
            return null;
        }
        return province.toString();
    }

    private record LockedOrder(CheckoutSession session, Order order) {
    }
}
