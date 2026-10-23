package com.ecommerce.repository;

import com.ecommerce.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {

    List<ProductImage> findAllByProductIdOrderBySortOrderAscIdAsc(Integer productId);

    long countByProductId(Integer productId);

    Optional<ProductImage> findByIdAndProductId(Integer id, Integer productId);

    Optional<ProductImage> findFirstByProductIdAndIdNotOrderBySortOrderAscIdAsc(Integer productId, Integer id);

    @Query("select coalesce(max(i.sortOrder), -1) from ProductImage i where i.product.id = :productId")
    int findMaxSortOrder(@Param("productId") Integer productId);
}
