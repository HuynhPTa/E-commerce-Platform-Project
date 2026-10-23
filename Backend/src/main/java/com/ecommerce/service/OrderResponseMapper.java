package com.ecommerce.service;

import com.ecommerce.dto.response.OrderDetailResponse;
import com.ecommerce.dto.response.OrderItemResponse;
import com.ecommerce.dto.response.OrderSummaryResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.util.MediaUrlUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

// Chuyển Order -> DTO dùng chung cho Admin và Kênh người bán.
// Gom query theo lô để danh sách không bị N+1 khi open-in-view = false.
@Component
@RequiredArgsConstructor
public class OrderResponseMapper {
    private final ShopRepository shopRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository variantRepository;

    public List<OrderSummaryResponse> toSummaries(List<Order> orders) {
        if (orders.isEmpty()) {
            return List.of();
        }
        Set<Integer> shopIds = orders.stream().map(Order::getShopId).collect(Collectors.toSet());
        Map<Integer, String> shopNames = shopRepository.findAllById(shopIds).stream()
                .collect(Collectors.toMap(Shop::getId, Shop::getName));

        List<Integer> orderIds = orders.stream().map(Order::getId).toList();
        Map<Integer, Integer> itemCounts = new HashMap<>();
        for (Object[] row : orderItemRepository.countByOrderIds(orderIds)) {
            itemCounts.put((Integer) row[0], ((Long) row[1]).intValue());
        }

        return orders.stream()
                .map(o -> toSummary(o, shopNames.get(o.getShopId()),
                        itemCounts.getOrDefault(o.getId(), 0)))
                .toList();
    }

    public OrderDetailResponse toDetail(Order order) {
        Map<Integer, ProductVariant> variants = new HashMap<>();
        List<Integer> variantIds = order.getItems().stream().map(OrderItem::getVariantId).toList();
        if (!variantIds.isEmpty()) {
            variants.putAll(variantRepository.findWithProductByIdIn(variantIds).stream()
                    .collect(Collectors.toMap(ProductVariant::getId, Function.identity())));
        }

        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> toItem(item, variants.get(item.getVariantId())))
                .toList();
        String shopName = shopRepository.findById(order.getShopId())
                .map(Shop::getName).orElse(null);
        User buyer = order.getBuyer();

        return new OrderDetailResponse(order.getId(), order.getCheckoutSession().getId(),
                order.getShopId(), shopName, buyer.getId(), fullName(buyer), buyer.getEmail(),
                order.getStatus().name(), order.getCheckoutSession().getPaymentMethod().name(),
                order.getShippingAddressSnapshot(), order.getSubtotalMinor(),
                order.getShippingFeeMinor(), order.getTotalMinor(),
                order.getCreatedAt(), order.getUpdatedAt(), items);
    }

    private OrderSummaryResponse toSummary(Order order, String shopName, int itemCount) {
        User buyer = order.getBuyer();
        return new OrderSummaryResponse(order.getId(), order.getShopId(), shopName,
                buyer.getId(), fullName(buyer), buyer.getEmail(), order.getStatus().name(),
                itemCount, order.getSubtotalMinor(), order.getShippingFeeMinor(),
                order.getTotalMinor(), order.getCheckoutSession().getPaymentMethod().name(),
                order.getCreatedAt());
    }

    private OrderItemResponse toItem(OrderItem item, ProductVariant variant) {
        Product product = variant == null ? null : variant.getProduct();
        String thumbnail = product != null ? product.getThumbnailUrl()
                : variant != null ? variant.getImageUrl() : null;
        return new OrderItemResponse(item.getId(), item.getVariantId(),
                product == null ? null : product.getId(), item.getProductNameSnapshot(),
                item.getVariantAttributesSnapshot(), item.getUnitPriceMinor(), item.getQuantity(),
                item.getSubtotalMinor(), MediaUrlUtil.toAbsolute(thumbnail));
    }

    public static String fullName(User user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isEmpty() ? user.getEmail() : name;
    }
}
