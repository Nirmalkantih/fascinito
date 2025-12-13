package com.fascinito.pos.service;

import com.fascinito.pos.dto.review.ProductRatingResponse;
import com.fascinito.pos.dto.review.ReviewRequest;
import com.fascinito.pos.dto.review.ReviewResponse;
import com.fascinito.pos.entity.Product;
import com.fascinito.pos.entity.ProductReview;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.ProductRepository;
import com.fascinito.pos.repository.ProductReviewRepository;
import com.fascinito.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductReviewService {
    
    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    
    /**
     * Helper method to get current authenticated user by email or phone
     */
    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        // Try to find by email first, then by phone
        return userRepository.findByEmailAndDeletedFalse(identifier)
                .or(() -> userRepository.findByPhoneAndDeletedFalse(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + identifier));
    }
    
    @Transactional
    public ReviewResponse addReview(Long productId, ReviewRequest request) {
        // Get current user
        User user = getCurrentUser();
        
        // Check if product exists
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        
        // Check if user already reviewed this product
        if (reviewRepository.existsByProductIdAndUserId(productId, user.getId())) {
            throw new IllegalStateException("You have already reviewed this product");
        }
        
        // Create review
        ProductReview review = ProductReview.builder()
                .product(product)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        
        ProductReview savedReview = reviewRepository.save(review);
        log.info("Review added for product {} by user {}", productId, user.getEmail());
        
        return mapToResponse(savedReview);
    }
    
    @Transactional
    public ReviewResponse updateReview(Long productId, Long reviewId, ReviewRequest request) {
        // Get current user
        User user = getCurrentUser();
        
        // Get review
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));
        
        // Check ownership
        if (!review.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("You can only update your own reviews");
        }
        
        // Check product match
        if (!review.getProduct().getId().equals(productId)) {
            throw new IllegalStateException("Review does not belong to this product");
        }
        
        // Update review
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        
        ProductReview updatedReview = reviewRepository.save(review);
        log.info("Review {} updated by user {}", reviewId, user.getEmail());
        
        return mapToResponse(updatedReview);
    }
    
    @Transactional
    public void deleteReview(Long productId, Long reviewId) {
        // Get current user
        User user = getCurrentUser();
        
        // Get review
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));
        
        // Check ownership (or admin)
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!review.getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new IllegalStateException("You can only delete your own reviews");
        }
        
        // Check product match
        if (!review.getProduct().getId().equals(productId)) {
            throw new IllegalStateException("Review does not belong to this product");
        }
        
        reviewRepository.delete(review);
        log.info("Review {} deleted by user {}", reviewId, user.getEmail());
    }
    
    @Transactional(readOnly = true)
    public List<ReviewResponse> getProductReviews(Long productId) {
        List<ProductReview> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return reviews.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ProductRatingResponse getProductRating(Long productId) {
        Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
        Long totalReviews = reviewRepository.getReviewCountByProductId(productId);
        
        return ProductRatingResponse.builder()
                .productId(productId)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .build();
    }
    
    @Transactional(readOnly = true)
    public ReviewResponse getUserReviewForProduct(Long productId) {
        // Get current user
        User user = getCurrentUser();
        
        return reviewRepository.findByProductIdAndUserId(productId, user.getId())
                .map(this::mapToResponse)
                .orElse(null);
    }
    
    private ReviewResponse mapToResponse(ProductReview review) {
        // Build user display name from first name + last name, fallback to email, then phone
        String userName;
        if (review.getUser().getFirstName() != null) {
            userName = review.getUser().getFirstName() + 
                      (review.getUser().getLastName() != null ? " " + review.getUser().getLastName() : "");
        } else if (review.getUser().getEmail() != null) {
            userName = review.getUser().getEmail();
        } else if (review.getUser().getPhone() != null) {
            userName = review.getUser().getPhone();
        } else {
            userName = "User #" + review.getUser().getId();
        }
            
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .userId(review.getUser().getId())
                .userName(userName)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
