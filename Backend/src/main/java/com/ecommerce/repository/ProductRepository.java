package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Integer>, JpaSpecificationExecutor<Product> {

    // products.category_id đang lưu dạng chuỗi (id hoặc slug danh mục)
    long countByCategoryIdIn(Collection<String> categoryKeys);

    long countByShopIdAndStatusIgnoreCase(String shopId, String status);

    // Dùng cho API seller: chỉ lấy sản phẩm thuộc đúng shop của người gọi
    Optional<Product> findByIdAndShopId(Integer id, String shopId);
}
