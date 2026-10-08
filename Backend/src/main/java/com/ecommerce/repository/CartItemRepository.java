package com.ecommerce.repository;

import com.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
    List<CartItem> findAllByUserIdOrderById(Integer userId);
    Optional<CartItem> findByIdAndUserId(Integer id, Integer userId);
    Optional<CartItem> findByUserIdAndVariantId(Integer userId, Integer variantId);
}
