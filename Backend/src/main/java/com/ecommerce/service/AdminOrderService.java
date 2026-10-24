package com.ecommerce.service;

import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminOrderService {
    private static final int MAX_PAGE_SIZE = 50;

    private final OrderRepository orderRepository;
    private final OrderResponseMapper orderResponseMapper;

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> list(OrderStatus status, String q, int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        String keyword = q == null || q.isBlank() ? null : q.trim();
        String term = keyword == null ? null : "%" + keyword.toLowerCase(Locale.ROOT) + "%";
        Integer idTerm = parseId(keyword);

        Page<Order> result = orderRepository.adminSearch(status, term, idTerm,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PageResponse<>(orderResponseMapper.toSummaries(result.getContent()),
                safePage, safeSize, result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse detail(int id) {
        Order order = orderRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        return orderResponseMapper.toDetail(order);
    }

    static Integer parseId(String keyword) {
        if (keyword == null) {
            return null;
        }
        try {
            return Integer.valueOf(keyword);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
