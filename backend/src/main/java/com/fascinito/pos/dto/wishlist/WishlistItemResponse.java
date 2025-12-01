package com.fascinito.pos.dto.wishlist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemResponse {
    private Long id;
    private Long productId;
    private String productSlug;
    private String productName;
    private String productImage;
    private String productCategory;
    private Double productPrice;
    private Boolean inStock;
    private LocalDateTime addedAt;
}
