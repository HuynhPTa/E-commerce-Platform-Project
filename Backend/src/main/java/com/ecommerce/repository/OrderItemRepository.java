package com.ecommerce.repository;

import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    // order_items chỉ lưu variant_id dạng số (snapshot), dùng để chặn xoá variant đã bán
    boolean existsByVariantId(int variantId);

    /**
     * Các món hàng người dùng đã mua và có thể đánh giá cho sản phẩm:
     * đơn COMPLETED, chưa có review nào cho cùng (order, product).
     */
    @Query("""
            select oi from OrderItem oi
            where oi.order.buyer.id = :userId
              and oi.order.status = :status
              and oi.variantId in (
                  select pv.id from ProductVariant pv where pv.product.id = :productId
              )
              and not exists (
                  select r.id from Review r
                  where r.orderId = oi.order.id and r.productId = :productId
              )
            order by oi.order.updatedAt desc, oi.id desc
            """)
    List<OrderItem> findEligibleForReview(@Param("userId") int userId,
                                          @Param("productId") int productId,
                                          @Param("status") OrderStatus status);

    /** Tổng số món hàng người dùng đã mua của sản phẩm (mọi trạng thái đơn). */
    @Query("""
            select count(oi) from OrderItem oi
            where oi.order.buyer.id = :userId
              and oi.variantId in (
                  select pv.id from ProductVariant pv where pv.product.id = :productId
              )
            """)
    long countPurchasedItems(@Param("userId") int userId, @Param("productId") int productId);

    /** Tổng số món hàng thuộc đơn COMPLETED của sản phẩm. */
    @Query("""
            select count(oi) from OrderItem oi
            where oi.order.buyer.id = :userId
              and oi.order.status = :status
              and oi.variantId in (
                  select pv.id from ProductVariant pv where pv.product.id = :productId
              )
            """)
    long countCompletedItems(@Param("userId") int userId,
                             @Param("productId") int productId,
                             @Param("status") OrderStatus status);

    /** Đếm số dòng hàng của nhiều đơn trong 1 query (tránh N+1 khi hiển thị danh sách). */
    @Query("""
            select oi.order.id, count(oi) from OrderItem oi
            where oi.order.id in :orderIds
            group by oi.order.id
            """)
    List<Object[]> countByOrderIds(@Param("orderIds") Collection<Integer> orderIds);
}
