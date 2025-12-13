package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.review.ProductRatingResponse;
import com.fascinito.pos.dto.review.ReviewRequest;
import com.fascinito.pos.dto.review.ReviewResponse;
import com.fascinito.pos.service.ProductReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/products/{productId}/reviews")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ProductReviewController {
    
    private final ProductReviewService reviewService;
    
    /**
     * Get all reviews for a product (Public)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getProductReviews(@PathVariable Long productId) {
        log.info("GET /products/{}/reviews", productId);
        List<ReviewResponse> reviews = reviewService.getProductReviews(productId);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Reviews retrieved successfully",
                reviews,
                LocalDateTime.now()
        ));
    }
    
    /**
     * Get product rating summary (Public)
     */
    @GetMapping("/rating")
    public ResponseEntity<ApiResponse<ProductRatingResponse>> getProductRating(@PathVariable Long productId) {
        log.info("GET /products/{}/reviews/rating", productId);
        ProductRatingResponse rating = reviewService.getProductRating(productId);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Rating retrieved successfully",
                rating,
                LocalDateTime.now()
        ));
    }
    
    /**
     * Get current user's review for a product (Authenticated)
     */
    @GetMapping("/my-review")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> getUserReview(@PathVariable Long productId) {
        log.info("GET /products/{}/reviews/my-review", productId);
        ReviewResponse review = reviewService.getUserReviewForProduct(productId);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                review != null ? "Review retrieved successfully" : "No review found",
                review,
                LocalDateTime.now()
        ));
    }
    
    /**
     * Add a review for a product (Authenticated)
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> addReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request) {
        log.info("POST /products/{}/reviews - rating: {}", productId, request.getRating());
        ReviewResponse review = reviewService.addReview(productId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(
                true,
                "Review added successfully",
                review,
                LocalDateTime.now()
        ));
    }
    
    /**
     * Update a review (Authenticated - Own reviews only)
     */
    @PutMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long productId,
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request) {
        log.info("PUT /products/{}/reviews/{}", productId, reviewId);
        ReviewResponse review = reviewService.updateReview(productId, reviewId, request);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Review updated successfully",
                review,
                LocalDateTime.now()
        ));
    }
    
    /**
     * Delete a review (Authenticated - Own reviews only, or Admin)
     */
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long productId,
            @PathVariable Long reviewId) {
        log.info("DELETE /products/{}/reviews/{}", productId, reviewId);
        reviewService.deleteReview(productId, reviewId);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Review deleted successfully",
                null,
                LocalDateTime.now()
        ));
    }
}
