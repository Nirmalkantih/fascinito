package com.fascinito.pos.service;

import com.fascinito.pos.dto.cart.CartItemRequest;
import com.fascinito.pos.dto.cart.CartItemResponse;
import com.fascinito.pos.dto.cart.CartResponse;
import com.fascinito.pos.entity.CartItem;
import com.fascinito.pos.entity.Product;
import com.fascinito.pos.entity.VariationOption;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.CartItemRepository;
import com.fascinito.pos.repository.ProductRepository;
import com.fascinito.pos.repository.VariationOptionRepository;
import com.fascinito.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final VariationOptionRepository variationOptionRepository;
    private final UserRepository userRepository;

    /**
     * Add item to cart or update quantity if exists
     */
    @Transactional
    public CartItemResponse addToCart(Long userId, CartItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Validate quantity is positive
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        // Check if item already in cart (consider variation option)
        Optional<CartItem> existingItem;
        VariationOption variationOption = null;
        
        if (request.getVariationId() != null) {
            variationOption = variationOptionRepository.findById(request.getVariationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variation option not found"));
            // Check for same product with same variation
            existingItem = cartItemRepository.findByUserAndProductIdAndVariationOption(user, request.getProductId(), variationOption);
        } else {
            // Check for same product without variation
            existingItem = cartItemRepository.findByUserAndProductIdAndVariationOptionIsNull(user, request.getProductId());
        }

        // Calculate new total quantity (existing + requested)
        Integer newTotalQuantity = request.getQuantity();
        if (existingItem.isPresent()) {
            newTotalQuantity = existingItem.get().getQuantity() + request.getQuantity();
        }

        // CRITICAL: Validate stock availability before adding/updating
        if (product.getTrackInventory()) {
            if (variationOption != null) {
                // Check variation option stock
                Integer availableStock = variationOption.getStockQuantity();
                
                if (availableStock == null || availableStock <= 0) {
                    throw new IllegalArgumentException("Selected variation is out of stock");
                }
                if (newTotalQuantity > availableStock) {
                    throw new IllegalArgumentException(
                            String.format("Insufficient stock for %s - %s. Available: %d, Requested: %d",
                                    product.getTitle(),
                                    variationOption.getName(),
                                    availableStock,
                                    newTotalQuantity)
                    );
                }
            } else {
                // Check product-level stock
                Integer availableStock = product.getStockQuantity();
                
                if (availableStock == null || availableStock <= 0) {
                    throw new IllegalArgumentException("Product is out of stock");
                }
                if (newTotalQuantity > availableStock) {
                    throw new IllegalArgumentException(
                            String.format("Insufficient stock for %s. Available: %d, Requested: %d",
                                    product.getTitle(),
                                    availableStock,
                                    newTotalQuantity)
                    );
                }
            }
        }

        CartItem cartItem;
        if (existingItem.isPresent()) {
            // Update quantity
            cartItem = existingItem.get();
            cartItem.setQuantity(newTotalQuantity);
            log.info("Updated cart item {} quantity to {}", cartItem.getId(), newTotalQuantity);
        } else {
            // Create new cart item
            cartItem = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(request.getQuantity())
                    .variationOption(variationOption)
                    .build();

            cartItem = cartItemRepository.save(cartItem);
            log.info("Added new item to cart for user {}", userId);
        }

        cartItemRepository.save(cartItem);
        return mapToResponse(cartItem);
    }

    /**
     * Get user's cart
     */
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<CartItem> cartItems = cartItemRepository.findByUser(user);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal shipping = BigDecimal.ZERO;

        List<CartItemResponse> items = cartItems.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        // Calculate totals
        for (CartItemResponse item : items) {
            subtotal = subtotal.add(item.getSubtotal());
        }

        // Calculate tax (10% of subtotal)
        tax = subtotal.multiply(new BigDecimal("0.10"));

        // Calculate shipping ($15 if items exist)
        if (!items.isEmpty()) {
            shipping = new BigDecimal("15.00");
        }

        BigDecimal totalAmount = subtotal.add(tax).add(shipping);

        return CartResponse.builder()
                .userId(userId)
                .items(items)
                .totalItems(items.size())
                .subtotal(subtotal)
                .tax(tax)
                .shipping(shipping)
                .discount(BigDecimal.ZERO)
                .totalAmount(totalAmount)
                .updatedAtTimestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * Update cart item quantity
     */
    @Transactional
    public CartItemResponse updateCartItem(Long userId, Long cartItemId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        // Verify ownership
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to cart item");
        }

        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        Product product = cartItem.getProduct();
        VariationOption variationOption = cartItem.getVariationOption();

        // CRITICAL: Validate stock availability before updating quantity
        if (product.getTrackInventory()) {
            if (variationOption != null) {
                // Check variation option stock
                Integer availableStock = variationOption.getStockQuantity();
                if (availableStock == null || availableStock <= 0) {
                    throw new IllegalArgumentException("Selected variation is out of stock");
                }
                if (quantity > availableStock) {
                    throw new IllegalArgumentException(
                            String.format("Insufficient stock for %s - %s. Available: %d, Requested: %d",
                                    product.getTitle(),
                                    variationOption.getName(),
                                    availableStock,
                                    quantity)
                    );
                }
            } else {
                // Check product-level stock
                Integer availableStock = product.getStockQuantity();
                if (availableStock == null || availableStock <= 0) {
                    throw new IllegalArgumentException("Product is out of stock");
                }
                if (quantity > availableStock) {
                    throw new IllegalArgumentException(
                            String.format("Insufficient stock for %s. Available: %d, Requested: %d",
                                    product.getTitle(),
                                    availableStock,
                                    quantity)
                    );
                }
            }
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
        log.info("Updated cart item {} quantity to {}", cartItemId, quantity);

        return mapToResponse(cartItem);
    }

    /**
     * Remove item from cart
     */
    @Transactional
    public void removeFromCart(Long userId, Long cartItemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        // Verify ownership
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to cart item");
        }

        cartItemRepository.deleteById(cartItemId);
        log.info("Removed cart item {} for user {}", cartItemId, userId);
    }

    /**
     * Clear entire cart
     */
    @Transactional
    public void clearCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        cartItemRepository.deleteByUser(user);
        log.info("Cleared cart for user {}", userId);
    }

    /**
     * Map CartItem entity to CartItemResponse DTO
     */
    private CartItemResponse mapToResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();

        // Determine the price to use
        BigDecimal price;
        VariationOption variationOption = cartItem.getVariationOption();

        if (variationOption != null) {
            // If variation option exists, use base price + adjustment
            price = product.getRegularPrice() != null ? product.getRegularPrice() : BigDecimal.ZERO;
            if (variationOption.getPriceAdjustment() != null && variationOption.getPriceAdjustment().compareTo(BigDecimal.ZERO) > 0) {
                price = price.add(variationOption.getPriceAdjustment());
            }
        } else {
            // No variation, use product's sale price or regular price
            price = product.getSalePrice() != null ? product.getSalePrice() : product.getRegularPrice();
        }

        BigDecimal subtotal = price.multiply(new BigDecimal(cartItem.getQuantity()));

        String productImage = null;
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            productImage = product.getImages().get(0).getImageUrl();
        }

        CartItemResponse.CartItemResponseBuilder builder = CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(product.getId())
                .productName(product.getTitle())
                .productImage(productImage)
                .productPrice(price)
                .quantity(cartItem.getQuantity())
                .subtotal(subtotal)
                .createdAtTimestamp(cartItem.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .updatedAtTimestamp(cartItem.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());

        // Add variation option if present
        if (variationOption != null) {
            builder.variationId(variationOption.getId());
            // variationId is sufficient to identify the option
            // The variation field is kept for API backward compatibility but not populated here
        }

        return builder.build();
    }
}
