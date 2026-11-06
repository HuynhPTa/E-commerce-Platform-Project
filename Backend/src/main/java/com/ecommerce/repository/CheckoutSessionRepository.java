package com.ecommerce.repository;

import com.ecommerce.entity.CheckoutSession;
import com.ecommerce.entity.CheckoutStatus;
import com.ecommerce.entity.PaymentMethod;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CheckoutSessionRepository extends JpaRepository<CheckoutSession, Integer> {

    /**
     * Khoá phiên thanh toán trước khi thao tác trên các đơn con.
     * Mọi luồng huỷ/giao hàng/thanh toán của cùng một phiên sẽ chạy lần lượt.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from CheckoutSession s where s.id = :id")
    Optional<CheckoutSession> findByIdForUpdate(@Param("id") int id);

    Optional<CheckoutSession> findByBuyer_IdAndIdempotencyKey(int buyerId, String idempotencyKey);

    List<CheckoutSession> findByStatusInAndPaymentMethodNotAndCreatedAtBefore(
            Collection<CheckoutStatus> statuses, PaymentMethod paymentMethod,
            LocalDateTime cutoff);
}
