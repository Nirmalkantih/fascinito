package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.cart.CartItemRequest;
import com.fascinito.pos.dto.cart.CartItemResponse;
import com.fascinito.pos.dto.cart.CartResponse;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@Slf4j
public class CartController {
    private final CartService cartService;
    private final UserRepository userRepository;

    /**
     * Get user's cart
     * GET /api/cart
     * Note: Works for both authenticated and guest users
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        Long userId = getCurrentUserIdOrNull();
        if (userId != null) {
            CartResponse cart = cartService.getCart(userId);
            return ResponseEntity.ok(ApiResponse.success(cart));
        }
        // Return empty cart for guest users
        return ResponseEntity.ok(ApiResponse.success(new CartResponse()));
    }

    /**
     * Add item to cart
     * POST /api/cart/items
     * Body: {productId, variationId (optional), quantity}
     * Note: Works for both authenticated and guest users
     */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartItemResponse>> addToCart(
            @RequestBody CartItemRequest request) {
        Long userId = getCurrentUserIdOrNull();
        
        if (userId != null) {
            CartItemResponse item = cartService.addToCart(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(item));
        }
        // For guest users, return success but they should use localStorage
        CartItemResponse guestItem = new CartItemResponse();
        guestItem.setProductId(request.getProductId());
        guestItem.setQuantity(request.getQuantity());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(guestItem));
    }

    /**
     * Update cart item quantity
     * PUT /api/cart/items/{itemId}
     * Body: {quantity}
     * Note: Works for authenticated users only (guest users manage via localStorage)
     */
    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartItemResponse>> updateCartItem(
            @PathVariable Long itemId,
            @RequestBody CartItemRequest request) {
        Long userId = getCurrentUserIdOrNull();
        if (userId == null) {
            // Guest users should use localStorage - return error response
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Please log in to update cart"));
        }
        CartItemResponse item = cartService.updateCartItem(userId, itemId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success(item));
    }

    /**
     * Remove item from cart
     * DELETE /api/cart/items/{itemId}
     * Note: Works for authenticated users only (guest users manage via localStorage)
     */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Object>> removeFromCart(@PathVariable Long itemId) {
        Long userId = getCurrentUserIdOrNull();
        if (userId == null) {
            // Guest users should use localStorage - return error response
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Please log in to remove items"));
        }
        cartService.removeFromCart(userId, itemId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Clear entire cart
     * DELETE /api/cart
     * Note: Works for authenticated users only (guest users manage via localStorage)
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Object>> clearCart() {
        Long userId = getCurrentUserIdOrNull();
        if (userId == null) {
            // Guest users should use localStorage - return error response
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Please log in to clear cart"));
        }
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Get current authenticated user ID
     */
    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getId();
    }

    /**
     * Get current authenticated user ID or null if not authenticated
     */
    private Long getCurrentUserIdOrNull() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            // Check if user is authenticated (not "anonymousUser")
            if ("anonymousUser".equals(username)) {
                return null;
            }
            var user = userRepository.findByEmail(username).orElse(null);
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
