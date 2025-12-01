package com.fascinito.pos.service;

import com.fascinito.pos.dto.wishlist.WishlistItemResponse;
import com.fascinito.pos.dto.wishlist.WishlistResponse;
import com.fascinito.pos.entity.Product;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.entity.Wishlist;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.ProductRepository;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    /**
     * Add product to user's wishlist
     */
    @Transactional
    public WishlistItemResponse addToWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Check if already in wishlist
        if (wishlistRepository.existsByUserAndProductId(user, productId)) {
            log.warn("Product {} already in wishlist for user {}", productId, userId);
            throw new IllegalArgumentException("Product already in your wishlist");
        }

        Wishlist wishlistItem = Wishlist.builder()
            .user(user)
            .product(product)
            .build();

        wishlistRepository.save(wishlistItem);
        log.info("Added product {} to wishlist for user {}", productId, userId);

        return mapToResponse(wishlistItem);
    }

    /**
     * Remove product from user's wishlist
     */
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        wishlistRepository.deleteByUserAndProductId(user, productId);
        log.info("Removed product {} from wishlist for user {}", productId, userId);
    }

    /**
     * Get user's complete wishlist
     */
    @Transactional(readOnly = true)
    public WishlistResponse getUserWishlist(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Wishlist> wishlistItems = wishlistRepository.findByUser(user);
        List<WishlistItemResponse> items = wishlistItems.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());

        return WishlistResponse.builder()
            .userId(userId)
            .items(items)
            .totalItems(items.size())
            .build();
    }

    /**
     * Check if product is in user's wishlist
     */
    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return wishlistRepository.existsByUserAndProductId(user, productId);
    }

    /**
     * Get wishlist count for user
     */
    @Transactional(readOnly = true)
    public long getWishlistCount(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return wishlistRepository.countByUser(user);
    }

    /**
     * Map Wishlist entity to WishlistItemResponse DTO
     */
    private WishlistItemResponse mapToResponse(Wishlist wishlist) {
        Product product = wishlist.getProduct();
        String imageUrl = null;

        // Get first image if available
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            imageUrl = product.getImages().get(0).getImageUrl();
        }

        return WishlistItemResponse.builder()
            .id(wishlist.getId())
            .productId(product.getId())
            .productSlug(product.getSlug())
            .productName(product.getTitle())
            .productImage(imageUrl)
            .productCategory(product.getCategory() != null ? product.getCategory().getName() : null)
            .productPrice(product.getSalePrice() != null ? product.getSalePrice().doubleValue() :
                         product.getRegularPrice() != null ? product.getRegularPrice().doubleValue() : null)
            .inStock(product.getTrackInventory() ? product.getStockQuantity() > 0 : true)
            .addedAt(wishlist.getAddedAt())
            .build();
    }
}
