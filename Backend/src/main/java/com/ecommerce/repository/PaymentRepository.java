package com.ecommerce.repository;

import com.ecommerce.entity.Payment;
import com.ecommerce.entity.PaymentMethod;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByCheckoutSession_Id(int checkoutSessionId);

    Optional<Payment> findByProviderAndProviderTransactionId(PaymentMethod provider,
                                                            String providerTransactionId);

    /**
     * Khóa payment trong transaction xử lý callback/IPN.
     * Hai callback đồng thời cùng một phiên sẽ xếp hàng, tránh cộng tiền/đổi trạng thái hai lần.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.checkoutSession.id = :checkoutSessionId")
    Optional<Payment> findByCheckoutSessionIdForUpdate(@Param("checkoutSessionId") int checkoutSessionId);
}
