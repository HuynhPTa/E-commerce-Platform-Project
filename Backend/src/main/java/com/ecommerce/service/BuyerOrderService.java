package com.ecommerce.service;

import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

// F15: người mua xem lịch sử và chi tiết đơn hàng của chính mình
@Service
@RequiredArgsConstructor
public class BuyerOrderService {
    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderResponseMapper orderResponseMapper;

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> list(String email, OrderStatus status, int page, int size) {
        User buyer = getUser(email);
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        Page<Order> result = orderRepository.buyerSearch(buyer.getId(), status,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PageResponse<>(orderResponseMapper.toSummaries(result.getContent()),
                safePage, safeSize, result.getTotalElements(), result.getTotalPages());
    }

    // Số đơn theo từng trạng thái, dùng cho số đếm trên các tab
    @Transactional(readOnly = true)
    public Map<String, Long> statusCounts(String email) {
        User buyer = getUser(email);
        return AdminDashboardService.statusCounts(orderRepository.countGroupByStatusForBuyer(buyer.getId()));
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse detail(String email, int id) {
        User buyer = getUser(email);
        Order order = orderRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        // Đơn của người khác trả 404 để không lộ sự tồn tại của đơn
        if (order.getBuyer().getId() != buyer.getId()) {
            throw new AppException(ErrorCode.ORDER_NOT_EXISTED);
        }
        return orderResponseMapper.toDetail(order);
    }

    private User getUser(String email) {
        return userRepository.findByEmailAndIsDelete(email, 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
