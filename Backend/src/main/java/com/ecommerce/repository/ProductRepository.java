package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Integer>, JpaSpecificationExecutor<Product> {

    // products.category_id đang lưu dạng chuỗi (id hoặc slug danh mục)
    long countByCategoryIdIn(Collection<String> categoryKeys);

    long countByShopIdAndStatusIgnoreCase(String shopId, String status);

    // Dùng cho API seller: chỉ lấy sản phẩm thuộc đúng shop của người gọi
    Optional<Product> findByIdAndShopId(Integer id, String shopId);

    // Khoá dòng product khi tính lại rating để nhiều review đồng thời không ghi đè nhau
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Integer id);
}
