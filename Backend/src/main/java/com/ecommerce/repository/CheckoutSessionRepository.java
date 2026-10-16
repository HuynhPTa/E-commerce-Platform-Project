package com.ecommerce.repository;

import com.ecommerce.entity.CheckoutSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckoutSessionRepository extends JpaRepository<CheckoutSession, Integer> {
}
