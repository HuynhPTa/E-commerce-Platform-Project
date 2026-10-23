package com.ecommerce.repository;

import com.ecommerce.entity.Shop;
import com.ecommerce.entity.ShopStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ShopRepository extends JpaRepository<Shop, Integer> {

    @EntityGraph(attributePaths = "owner")
    Optional<Shop> findWithOwnerById(Integer id);

    @EntityGraph(attributePaths = "owner")
    Optional<Shop> findByOwnerId(int ownerId);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    // Danh sách cho trang Admin: lọc theo trạng thái + từ khoá (tên shop / email chủ shop)
    @EntityGraph(attributePaths = "owner")
    @Query("""
            select s from Shop s
            where (:status is null or s.status = :status)
              and (:q is null or lower(s.name) like :q or lower(s.owner.email) like :q)
            """)
    Page<Shop> search(@Param("status") ShopStatus status, @Param("q") String q, Pageable pageable);

    @Query("select s.status, count(s) from Shop s group by s.status")
    List<Object[]> countByStatus();

    // Gắn shop vào danh sách người dùng của Admin trong 1 query
    @EntityGraph(attributePaths = "owner")
    List<Shop> findByOwnerIdIn(Collection<Integer> ownerIds);

    long countByStatus(ShopStatus status);
}
