package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Đánh giá sản phẩm gắn với đúng một món hàng (order_item) đã mua.
 * <p>
 * - {@code order_item_id} UNIQUE: mỗi món hàng chỉ được đánh giá một lần.
 * - {@code (order_id, product_id)} UNIQUE: một sản phẩm chỉ được đánh giá một lần
 *   trong cùng một đơn, kể cả khi đơn mua nhiều biến thể của cùng sản phẩm.
 */
@Entity
@Table(name = "reviews",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_reviews_order_item", columnNames = "order_item_id"),
                @UniqueConstraint(name = "uk_reviews_order_product", columnNames = {"order_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_reviews_product_created", columnList = "product_id, created_at"),
                @Index(name = "idx_reviews_user", columnList = "user_id")
        })
@Getter
@Setter
@NoArgsConstructor
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "order_item_id", nullable = false)
    private int orderItemId;

    @Column(name = "order_id", nullable = false)
    private int orderId;

    @Column(name = "user_id", nullable = false)
    private int userId;

    @Column(name = "product_id", nullable = false)
    private int productId;

    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
