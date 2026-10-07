package com.ecommerce.service;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartItemResponse;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.exception.ErrorCode;
import com.ecommerce.exception.InsufficientStockException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartItemRepository cartRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CartItemResponse> getCart(String email) {
        User user = getUser(email);
        return cartRepository.findAllByUserIdOrderById(user.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public CartItemResponse add(String email, CartItemRequest request) {
        User user = getUser(email);
        ProductVariant variant = getVariantForUpdate(request.getVariantId());
        ensureAvailable(variant, request.getQuantity());

        CartItem item = cartRepository.findByUserIdAndVariantId(user.getId(), variant.getId())
                .orElseGet(() -> {
                    CartItem created = new CartItem();
                    created.setUser(user);
                    created.setVariant(variant);
                    created.setQuantity(0);
                    return created;
                });
        int newQuantity = item.getQuantity() + request.getQuantity();
        ensureAvailable(variant, newQuantity);
        item.setQuantity(newQuantity);
        return toResponse(cartRepository.save(item));
    }

    @Transactional
    public CartItemResponse update(String email, Integer itemId, int quantity) {
        User user = getUser(email);
        CartItem item = getCartItem(itemId, user.getId());
        ProductVariant variant = getVariantForUpdate(item.getVariant().getId());
        ensureAvailable(variant, quantity);
        item.setQuantity(quantity);
        return toResponse(cartRepository.save(item));
    }

    @Transactional
    public void remove(String email, Integer itemId) {
        User user = getUser(email);
        cartRepository.delete(getCartItem(itemId, user.getId()));
    }

    private User getUser(String email) {
        return userRepository.findByEmailAndIsDelete(email, 0)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private CartItem getCartItem(Integer id, Integer userId) {
        return cartRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
    }

    private ProductVariant getVariantForUpdate(Integer id) {
        ProductVariant variant = variantRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        if (!"ACTIVE".equalsIgnoreCase(variant.getProduct().getStatus())) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        return variant;
    }

    private void ensureAvailable(ProductVariant variant, int quantity) {
        if (quantity < 1 || variant.getStockQuantity() < quantity) {
            throw new InsufficientStockException();
        }
    }

    private CartItemResponse toResponse(CartItem item) {
        ProductVariant variant = item.getVariant();
        Product product = variant.getProduct();
        return new CartItemResponse(item.getId(), variant.getId(), product.getId(), product.getName(),
                variant.getImageUrl() != null ? variant.getImageUrl() : product.getThumbnailUrl(),
                product.getShopId(), product.getShopName(),
                variant.getAttributes() == null ? Map.of() : variant.getAttributes(),
                variant.getPriceMinor(), variant.getStockQuantity(), item.getQuantity());
    }
}
