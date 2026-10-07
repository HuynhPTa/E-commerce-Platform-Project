package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "category_id", length = 80)
    private String categoryId;

    @Column(name = "shop_id", length = 80)
    private String shopId;

    @Column(name = "shop_name", length = 160)
    private String shopName;

    @Column(name = "thumbnail_url", length = 512)
    private String thumbnailUrl;

    @Column(name = "rating_avg", nullable = false)
    private double ratingAvg = 0;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount = 0;

    @Column(name = "sold_count", nullable = false)
    private int soldCount = 0;

    @Column(nullable = false, length = 24)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();
}
