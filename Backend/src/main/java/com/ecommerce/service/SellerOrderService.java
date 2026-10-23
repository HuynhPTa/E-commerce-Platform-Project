package com.ecommerce.service;

import com.ecommerce.dto.request.OrderStatusRequest;
import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.SellerDashboardResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.ShopStatus;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SellerOrderService {
    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final OrderRepository orderRepository;
    private final OrderResponseMapper orderResponseMapper;

    @Transactional(readOnly = true)
    public SellerDashboardResponse dashboard(String email) {
        Shop shop = getApprovedShop(email);
        int shopId = shop.getId();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        long productCount = productRepository.countByShopIdAndStatusIgnoreCase(
                String.valueOf(shopId), "ACTIVE");
        long totalOrders = orderRepository.countByShopId(shopId);
        long pendingOrders = orderRepository.countByShopIdAndStatus(shopId, OrderStatus.PENDING);
        long completedOrders = orderRepository.countByShopIdAndStatus(shopId, OrderStatus.COMPLETED);
        long cancelledOrders = orderRepository.countByShopIdAndStatus(shopId, OrderStatus.CANCELLED);
        long revenueMinor = orderRepository.sumRevenueByShopIdAndStatus(shopId, OrderStatus.COMPLETED);
        long todayOrders = orderRepository.countByShopIdAndCreatedAtGreaterThanEqual(shopId, startOfToday);
        long todayRevenueMinor = orderRepository.sumRevenueByShopIdAndStatusSince(
                shopId, OrderStatus.COMPLETED, startOfToday);

        Map<String, Long> ordersByStatus = AdminDashboardService
                .statusCounts(orderRepository.countGroupByStatusForShop(shopId));
        List<OrderSummaryResponse> recentOrders = orderResponseMapper
                .toSummaries(orderRepository.findTop8ByShopIdOrderByCreatedAtDesc(shopId));

        return new SellerDashboardResponse(productCount, totalOrders, pendingOrders,
                completedOrders, cancelledOrders, revenueMinor, todayOrders, todayRevenueMinor,
                ordersByStatus, recentOrders);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> list(String email, OrderStatus status,
                                                   String q, int page, int size) {
        Shop shop = getApprovedShop(email);
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        String keyword = q == null || q.isBlank() ? null : q.trim();
        String term = keyword == null ? null : "%" + keyword.toLowerCase(Locale.ROOT) + "%";
        Integer idTerm = AdminOrderService.parseId(keyword);

        Page<Order> result = orderRepository.sellerSearch(shop.getId(), status, term, idTerm,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PageResponse<>(orderResponseMapper.toSummaries(result.getContent()),
                safePage, safeSize, result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse detail(String email, int id) {
        Shop shop = getApprovedShop(email);
        return orderResponseMapper.toDetail(getOwnedOrder(shop, id));
    }

    @Transactional
    public OrderDetailResponse updateStatus(String email, int id, OrderStatusRequest request) {
        Shop shop = getApprovedShop(email);
        Order order = getOwnedOrder(shop, id);
        OrderStatus next = request.getStatus();
        if (!order.getStatus().canSellerMoveTo(next)) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        // Huỷ đơn trước khi giao hàng thì trả lại tồn kho đã trừ lúc checkout.
        if (next == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                variantRepository.increaseStock(item.getVariantId(), item.getQuantity());
            }
        }

        order.setStatus(next);
        orderRepository.save(order);
        return orderResponseMapper.toDetail(order);
    }

    private Shop getApprovedShop(String email) {
        User user = userRepository.findByEmailAndIsDelete(email, 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTED));
        if (shop.getStatus() != ShopStatus.APPROVED) {
            throw new AppException(ErrorCode.SHOP_NOT_AVAILABLE);
        }
        return shop;
    }

    private Order getOwnedOrder(Shop shop, int id) {
        Order order = orderRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        // Đơn của shop khác trả 404 để không lộ sự tồn tại của đơn.
        if (order.getShopId() != shop.getId()) {
            throw new AppException(ErrorCode.ORDER_NOT_EXISTED);
        }
        return order;
    }
}
