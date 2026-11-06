package com.ecommerce.service;

import com.ecommerce.dto.request.CreatePaymentRequest;
import com.ecommerce.dto.response.PaymentUrlResponse;
import com.ecommerce.entity.CheckoutSession;
import com.ecommerce.entity.CheckoutStatus;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.Payment;
import com.ecommerce.entity.PaymentMethod;
import com.ecommerce.entity.PaymentStatus;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.CheckoutSessionRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.payment.MomoProvider;
import com.ecommerce.service.payment.PaymentCallback;
import com.ecommerce.service.payment.PaymentProvider;
import com.ecommerce.service.payment.VnPayProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final UserRepository userRepository;
    private final CheckoutSessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final VnPayProvider vnPayProvider;
    private final MomoProvider momoProvider;

    @Transactional
    public PaymentUrlResponse createPaymentUrl(String email, CreatePaymentRequest request, String clientIp) {
        if (request.checkoutSessionId() == null || request.provider() == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        User buyer = userRepository.findByEmailAndIsDelete(email, 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Khoá phiên trước khi đọc payment để không đua với luồng huỷ/giao hàng.
        CheckoutSession session = sessionRepository.findByIdForUpdate(request.checkoutSessionId())
                .orElseThrow(() -> new AppException(ErrorCode.CHECKOUT_SESSION_NOT_FOUND));

        // Không lộ sự tồn tại của phiên thanh toán của người khác.
        if (session.getBuyer().getId() != buyer.getId()) {
            throw new AppException(ErrorCode.CHECKOUT_SESSION_NOT_FOUND);
        }
        if (session.getStatus() == CheckoutStatus.PAID) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
        }
        if (session.getStatus() == CheckoutStatus.EXPIRED) {
            throw new AppException(ErrorCode.PAYMENT_SESSION_NOT_PAYABLE);
        }
        if (session.getPaymentMethod() != request.provider()) {
            throw new AppException(ErrorCode.PAYMENT_METHOD_MISMATCH);
        }
        if (session.getPaymentMethod() == PaymentMethod.COD) {
            throw new AppException(ErrorCode.PAYMENT_NOT_REQUIRED);
        }

        // Phiên không còn đơn hiệu lực (hoặc tổng 0) thì không được tạo giao dịch mới.
        int activeTotal = activeTotal(session.getId());
        if (activeTotal <= 0) {
            throw new AppException(ErrorCode.PAYMENT_SESSION_NOT_PAYABLE);
        }
        if (session.getTotalAmountMinor() != activeTotal) {
            session.setTotalAmountMinor(activeTotal);
            sessionRepository.save(session);
        }

        PaymentProvider provider = providerFor(session.getPaymentMethod());
        if (!provider.isConfigured()) {
            throw new AppException(ErrorCode.PAYMENT_NOT_CONFIGURED);
        }

        Payment payment = paymentRepository.findByCheckoutSession_Id(session.getId()).orElse(null);
        if (payment == null) {
            payment = new Payment();
            payment.setCheckoutSession(session);
            payment.setAmountMinor(session.getTotalAmountMinor());
            payment.setStatus(PaymentStatus.PENDING);
        } else {
            if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
                throw new AppException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
            }
            if (payment.getStatus() == PaymentStatus.REFUND_REQUIRED) {
                throw new AppException(ErrorCode.PAYMENT_SESSION_NOT_PAYABLE);
            }
            // Cho phép thử lại sau giao dịch thất bại; luôn đồng bộ lại số tiền mới nhất.
            payment.setAmountMinor(session.getTotalAmountMinor());
            payment.setProviderTransactionId(null);
            payment.setPaidAt(null);
            payment.setStatus(PaymentStatus.PENDING);
        }
        payment.setProvider(session.getPaymentMethod());

        // Chỉ chuyển phiên về PENDING sau khi đã có URL hợp lệ.
        String redirectUrl = provider.createPaymentUrl(payment, clientIp);
        session.setStatus(CheckoutStatus.PENDING);
        paymentRepository.save(payment);
        sessionRepository.save(session);

        return new PaymentUrlResponse(payment.getId(), session.getId(),
                session.getPaymentMethod().name(), redirectUrl);
    }

    // noRollbackFor: khi số tiền callback sai, markFailed() phải được commit
    // trước khi ném lỗi để IPN trả mã 04 và không thử lại vô hạn.
    @Transactional(noRollbackFor = AppException.class)
    public PaymentResult processVnPay(Map<String, String> params) {
        return process(PaymentMethod.VNPAY, params);
    }

    @Transactional(noRollbackFor = AppException.class)
    public PaymentResult processMomo(Map<String, String> params) {
        return process(PaymentMethod.MOMO, params);
    }

    private PaymentResult process(PaymentMethod method, Map<String, String> params) {
        PaymentCallback callback = providerFor(method).verifyCallback(params);
        if (!callback.validSignature()) {
            throw new AppException(ErrorCode.PAYMENT_INVALID_SIGNATURE);
        }
        if (callback.checkoutSessionId() <= 0) {
            throw new AppException(ErrorCode.PAYMENT_NOT_FOUND);
        }

        // Khoá phiên trước, payment sau: cùng thứ tự với luồng huỷ/giao hàng.
        CheckoutSession session = sessionRepository.findByIdForUpdate(callback.checkoutSessionId())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        Payment payment = paymentRepository.findByCheckoutSessionIdForUpdate(callback.checkoutSessionId())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getProvider() != method) {
            throw new AppException(ErrorCode.PAYMENT_METHOD_MISMATCH);
        }

        // IPN/return có thể được gọi lặp: trả kết quả cũ trước khi kiểm tra tiền.
        // Sau khi huỷ đơn, payment có thể đã bị đưa về 0 nên không được báo sai số tiền.
        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            return new PaymentResult(session.getId(), true,
                    payment.getProviderTransactionId(), "Giao dịch đã được xử lý");
        }
        if (payment.getStatus() == PaymentStatus.REFUND_REQUIRED) {
            return new PaymentResult(session.getId(), false,
                    payment.getProviderTransactionId(), "Giao dịch đã ghi nhận, cần hoàn tiền");
        }

        // Tiền đã vào nhưng mọi đơn của phiên đã bị huỷ: ghi nhận cần hoàn tiền
        // trước bước so khớp số tiền (lúc này payment/session đã về 0).
        if (callback.success() && hasActiveOrder(session.getId()) == false) {
            markRefundRequired(session, payment, callback);
            return new PaymentResult(session.getId(), false,
                    payment.getProviderTransactionId(), "Giao dịch đã ghi nhận, cần hoàn tiền");
        }

        if (callback.amountMinor() != payment.getAmountMinor()) {
            markFailed(payment, callback);
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        if (callback.success()) {
            if (markSucceeded(session, payment, callback) == false) {
                return new PaymentResult(session.getId(), false,
                        payment.getProviderTransactionId(), "Giao dịch đã ghi nhận, cần hoàn tiền");
            }
            return new PaymentResult(session.getId(), true,
                    payment.getProviderTransactionId(), "Thanh toán thành công");
        }

        markFailed(payment, callback);
        return new PaymentResult(session.getId(), false,
                null, callback.message());
    }

    /** Kiểm tra phiên còn ít nhất một đơn chưa huỷ hay không. */
    private boolean hasActiveOrder(int sessionId) {
        List<Order> orders = orderRepository.findByCheckoutSession_Id(sessionId);
        for (Order order : orders) {
            if (order.getStatus() != OrderStatus.CANCELLED) {
                return true;
            }
        }
        return false;
    }

    /**
     * Tiền đã vào nhưng không còn đơn để xác nhận.
     * Giữ lại số tiền thực nhận để bộ phận vận hành hoàn tiền cho khách.
     */
    private void markRefundRequired(CheckoutSession session, Payment payment,
                                    PaymentCallback callback) {
        payment.setAmountMinor(callback.amountMinor());
        payment.setStatus(PaymentStatus.REFUND_REQUIRED);
        payment.setProviderTransactionId(callback.providerTransactionId());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        session.setTotalAmountMinor(0);
        session.setStatus(CheckoutStatus.FAILED);
        sessionRepository.save(session);
    }

    private boolean markSucceeded(CheckoutSession session, Payment payment,
                                  PaymentCallback callback) {
        List<Order> orders = orderRepository.findByCheckoutSession_Id(session.getId());

        // Phòng thủ: nếu mọi đơn đã bị huỷ thì không xác nhận đơn, ghi nhận cần hoàn tiền.
        if (hasActiveOrder(session.getId()) == false) {
            markRefundRequired(session, payment, callback);
            return false;
        }

        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setProviderTransactionId(callback.providerTransactionId());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        session.setStatus(CheckoutStatus.PAID);
        sessionRepository.save(session);

        for (Order order : orders) {
            // Chỉ xác nhận đơn còn chờ; không đè lên đơn đã hủy/giao.
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
            }
        }
        return true;
    }

    private void markFailed(Payment payment, PaymentCallback callback) {
        if (payment.getStatus() == PaymentStatus.SUCCEEDED
                || payment.getStatus() == PaymentStatus.REFUND_REQUIRED) {
            return;
        }
        payment.setStatus(PaymentStatus.FAILED);
        payment.setProviderTransactionId(callback.providerTransactionId());
        paymentRepository.save(payment);

        CheckoutSession session = payment.getCheckoutSession();
        if (session.getStatus() != CheckoutStatus.PAID) {
            session.setStatus(CheckoutStatus.FAILED);
            sessionRepository.save(session);
        }
    }

    private int activeTotal(int sessionId) {
        List<Order> orders = orderRepository.findByCheckoutSession_Id(sessionId);
        int total = 0;
        for (Order order : orders) {
            if (order.getStatus() != OrderStatus.CANCELLED) {
                total = total + order.getTotalMinor();
            }
        }
        return total;
    }

    private PaymentProvider providerFor(PaymentMethod method) {
        return switch (method) {
            case VNPAY -> vnPayProvider;
            case MOMO -> momoProvider;
            case COD -> throw new AppException(ErrorCode.PAYMENT_NOT_REQUIRED);
        };
    }

    public record PaymentResult(int checkoutSessionId, boolean success,
                                String providerTransactionId, String message) {
    }
}
