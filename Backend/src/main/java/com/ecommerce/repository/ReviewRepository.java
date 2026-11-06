package com.ecommerce.repository;

import com.ecommerce.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    boolean existsByOrderItemId(int orderItemId);

    boolean existsByOrderIdAndProductId(int orderId, int productId);

    Page<Review> findByProductIdOrderByCreatedAtDescIdDesc(int productId, Pageable pageable);

    Optional<Review> findFirstByUserIdAndProductIdOrderByCreatedAtDescIdDesc(int userId, int productId);

    long countByProductId(int productId);

    @Query("select avg(r.rating) from Review r where r.productId = :productId")
    Double averageRatingByProductId(@Param("productId") int productId);
}
