package com.ecommerce.service;

import com.ecommerce.entity.CheckoutSession;
import com.ecommerce.entity.CheckoutStatus;
import com.ecommerce.entity.PaymentMethod;
import com.ecommerce.repository.CheckoutSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Quét các phiên thanh toán trực tuyến quá hạn nhưng chưa trả tiền.
 *
 * Mỗi phiên được xử lý trong transaction riêng; phiên lỗi không chặn các phiên khác.
 * Job chỉ chạy khi checkout.expiry.enabled=true (mặc định bật ở môi trường thật).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "checkout.expiry.enabled", havingValue = "true", matchIfMissing = true)
public class CheckoutExpiryScheduler {

    private final CheckoutSessionRepository sessionRepository;
    private final OrderLifecycleService orderLifecycleService;

    @Value("${checkout.expiry-minutes:120}")
    private long expiryMinutes;

    @Scheduled(
            initialDelayString = "${checkout.expiry-initial-delay-ms:60000}",
            fixedDelayString = "${checkout.expiry-scan-ms:60000}")
    public void expireStaleSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(expiryMinutes);
        List<CheckoutSession> staleSessions = sessionRepository
                .findByStatusInAndPaymentMethodNotAndCreatedAtBefore(
                        List.of(CheckoutStatus.PENDING, CheckoutStatus.FAILED),
                        PaymentMethod.COD,
                        cutoff);

        for (CheckoutSession session : staleSessions) {
            try {
                orderLifecycleService.expireSession(session.getId(), cutoff);
            } catch (RuntimeException ex) {
                log.warn("Không thể hết hạn phiên thanh toán {}", session.getId(), ex);
            }
        }
    }
}
