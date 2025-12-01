package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.wishlist.WishlistItemResponse;
import com.fascinito.pos.dto.wishlist.WishlistResponse;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wishlist")
@RequiredArgsConstructor
@Slf4j
public class WishlistController {
    private final WishlistService wishlistService;
    private final UserRepository userRepository;

    /**
     * Get current user's wishlist
     * Note: Works for authenticated users only. Guest users should use localStorage
     */
    @GetMapping
    public ResponseEntity<ApiResponse<WishlistResponse>> getWishlist() {
        Long userId = getCurrentUserIdOrNull();
        if (userId != null) {
            WishlistResponse wishlist = wishlistService.getUserWishlist(userId);
            return ResponseEntity.ok(ApiResponse.success(wishlist));
        }
        // Guest users: return empty wishlist
        return ResponseEntity.ok(ApiResponse.success(new WishlistResponse()));
    }

    /**
     * Add product to wishlist
     * Note: Works for both authenticated and guest users
     */
    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<WishlistItemResponse>> addToWishlist(
        @PathVariable Long productId) {
        Long userId = getCurrentUserIdOrNull();
        if (userId != null) {
            WishlistItemResponse response = wishlistService.addToWishlist(userId, productId);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product added to wishlist", response));
        }
        // For guest users, return success but they should use localStorage
        WishlistItemResponse guestItem = new WishlistItemResponse();
        guestItem.setProductId(productId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Product added to wishlist", guestItem));
    }

    /**
     * Remove product from wishlist
     * Note: Works for both authenticated and guest users
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<?>> removeFromWishlist(
        @PathVariable Long productId) {
        Long userId = getCurrentUserIdOrNull();
        if (userId != null) {
            wishlistService.removeFromWishlist(userId, productId);
        }
        // For guest users, they should use localStorage
        return ResponseEntity.ok(ApiResponse.success("Product removed from wishlist", null));
    }

    /**
     * Check if product is in wishlist
     * Note: Works for authenticated users only. Guest users should use localStorage
     */
    @GetMapping("/check/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> isInWishlist(
        @PathVariable Long productId) {
        Long userId = getCurrentUserIdOrNull();
        if (userId != null) {
            boolean inWishlist = wishlistService.isInWishlist(userId, productId);
            return ResponseEntity.ok(ApiResponse.success(inWishlist));
        }
        // Guest users: return false, wishlist is managed via localStorage
        return ResponseEntity.ok(ApiResponse.success(false));
    }

    /**
     * Get wishlist count
     * Note: Works for authenticated users only
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getWishlistCount() {
        Long userId = getCurrentUserIdOrNull();
        if (userId != null) {
            long count = wishlistService.getWishlistCount(userId);
            return ResponseEntity.ok(ApiResponse.success(count));
        }
        // Guest users: return 0
        return ResponseEntity.ok(ApiResponse.success(0L));
    }

    /**
     * Helper method to get current authenticated user ID
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
