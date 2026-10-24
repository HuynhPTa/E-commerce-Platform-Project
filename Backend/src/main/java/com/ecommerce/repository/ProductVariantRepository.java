package com.ecommerce.repository;

import com.ecommerce.entity.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from ProductVariant v join fetch v.product where v.id = :id")
    Optional<ProductVariant> findByIdForUpdate(@Param("id") Integer id);

    List<ProductVariant> findAllByProductIdOrderByIdAsc(Integer productId);

    long countByProductId(Integer productId);

    Optional<ProductVariant> findByIdAndProductId(Integer id, Integer productId);

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Integer id);

    // Lấy kèm product để hiển thị ảnh/tên trong chi tiết đơn hàng (1 query cho nhiều variant)
    @EntityGraph(attributePaths = "product")
    List<ProductVariant> findWithProductByIdIn(Collection<Integer> ids);

    // Hoàn kho khi người bán huỷ đơn
    @Modifying
    @Query("update ProductVariant v set v.stockQuantity = v.stockQuantity + :quantity where v.id = :id")
    int increaseStock(@Param("id") int id, @Param("quantity") int quantity);
}
