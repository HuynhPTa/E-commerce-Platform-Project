package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "order_items")
@Getter @Setter
@NoArgsConstructor
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Chỉ tham chiếu, không cascade xóa
    @Column(name = "variant_id", nullable = false)
    private int variantId;

    @Column(name = "product_name_snapshot", nullable = false, length = 200)
    private String productNameSnapshot;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variant_attributes_snapshot", columnDefinition = "json")
    private Map<String, Object> variantAttributesSnapshot;

    @Column(name = "unit_price_minor", nullable = false)
    private int unitPriceMinor;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "subtotal_minor", nullable = false)
    private int subtotalMinor;
}
