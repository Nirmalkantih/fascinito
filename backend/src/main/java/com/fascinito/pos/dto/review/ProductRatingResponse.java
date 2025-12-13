package com.fascinito.pos.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRatingResponse {
    
    private Long productId;
    private Double averageRating;
    private Long totalReviews;
}
