package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Một bản ghi thanh toán cho một checkout session.
 * Unique checkout_session_id bảo đảm mỗi phiên chỉ có tối đa một payment.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "checkout_session_id", nullable = false, unique = true)
    private CheckoutSession checkoutSession;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PaymentMethod provider;

    @Column(name = "provider_transaction_id", length = 255)
    private String providerTransactionId;

    @Column(name = "amount_minor", nullable = false)
    private int amountMinor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PaymentStatus status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
