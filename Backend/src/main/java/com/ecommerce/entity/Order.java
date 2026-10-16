package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "orders") // "order" là từ khóa SQL nên dùng orders
@Getter @Setter
@NoArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "checkout_session_id", nullable = false)
    private CheckoutSession checkoutSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    // Chỉ lưu id để không phụ thuộc entity Shop của CV2
    @Column(name = "shop_id", nullable = false)
    private int shopId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private OrderStatus status;

    // Snapshot địa chỉ lúc đặt: không FK sang bảng address
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "shipping_address_snapshot", nullable = false, columnDefinition = "json")
    private Map<String, Object> shippingAddressSnapshot;

    @Column(name = "subtotal_minor", nullable = false)
    private int subtotalMinor;

    @Column(name = "shipping_fee_minor", nullable = false)
    private int shippingFeeMinor;

    @Column(name = "total_minor", nullable = false)
    private int totalMinor;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }
}
