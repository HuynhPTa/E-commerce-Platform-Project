package com.ecommerce.repository;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByCheckoutSession_Id(int checkoutSessionId);

    // ---------------------------------------------------------------- Admin

    @EntityGraph(attributePaths = {"buyer", "checkoutSession"})
    @Query("""
            select o from Order o
            where (:status is null or o.status = :status)
              and (:term is null
                   or lower(o.buyer.email) like :term
                   or lower(o.buyer.firstName) like :term
                   or lower(o.buyer.lastName) like :term
                   or o.shopId in (select s.id from Shop s where lower(s.name) like :term)
                   or (:idTerm is not null and o.id = :idTerm))
            """)
    Page<Order> adminSearch(@Param("status") OrderStatus status,
                            @Param("term") String term,
                            @Param("idTerm") Integer idTerm,
                            Pageable pageable);

    @EntityGraph(attributePaths = {"buyer", "checkoutSession"})
    List<Order> findTop8ByOrderByCreatedAtDesc();

    @Query("select o.status, count(o) from Order o group by o.status")
    List<Object[]> countGroupByStatus();

    @Query("select coalesce(sum(o.totalMinor), 0) from Order o where o.status = :status")
    long sumRevenueByStatus(@Param("status") OrderStatus status);

    @Query("""
            select coalesce(sum(o.totalMinor), 0) from Order o
            where o.status = :status and o.createdAt >= :from
            """)
    long sumRevenueByStatusSince(@Param("status") OrderStatus status, @Param("from") LocalDateTime from);

    long countByCreatedAtGreaterThanEqual(LocalDateTime from);

    // ---------------------------------------------------------------- Seller

    @EntityGraph(attributePaths = {"buyer", "checkoutSession"})
    @Query("""
            select o from Order o
            where o.shopId = :shopId
              and (:status is null or o.status = :status)
              and (:term is null
                   or lower(o.buyer.email) like :term
                   or lower(o.buyer.firstName) like :term
                   or lower(o.buyer.lastName) like :term
                   or (:idTerm is not null and o.id = :idTerm))
            """)
    Page<Order> sellerSearch(@Param("shopId") int shopId,
                             @Param("status") OrderStatus status,
                             @Param("term") String term,
                             @Param("idTerm") Integer idTerm,
                             Pageable pageable);

    @EntityGraph(attributePaths = {"buyer", "checkoutSession"})
    List<Order> findTop8ByShopIdOrderByCreatedAtDesc(int shopId);

    @Query("select o.status, count(o) from Order o where o.shopId = :shopId group by o.status")
    List<Object[]> countGroupByStatusForShop(@Param("shopId") int shopId);

    @Query("""
            select coalesce(sum(o.totalMinor), 0) from Order o
            where o.shopId = :shopId and o.status = :status
            """)
    long sumRevenueByShopIdAndStatus(@Param("shopId") int shopId, @Param("status") OrderStatus status);

    @Query("""
            select coalesce(sum(o.totalMinor), 0) from Order o
            where o.shopId = :shopId and o.status = :status and o.createdAt >= :from
            """)
    long sumRevenueByShopIdAndStatusSince(@Param("shopId") int shopId,
                                          @Param("status") OrderStatus status,
                                          @Param("from") LocalDateTime from);

    long countByShopIdAndCreatedAtGreaterThanEqual(int shopId, LocalDateTime from);

    // ---------------------------------------------------------------- Chi tiết

    // items là collection nên chỉ dùng cho 1 đơn, không dùng cho phân trang.
    @EntityGraph(attributePaths = {"buyer", "checkoutSession", "items"})
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findDetailById(@Param("id") int id);

    long countByShopId(int shopId);

    long countByShopIdAndStatus(int shopId, OrderStatus status);

    long countByStatus(OrderStatus status);
}
