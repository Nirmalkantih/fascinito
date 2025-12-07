package com.fascinito.pos.dto.cart;

import com.fascinito.pos.dto.product.ProductVariationResponse;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private BigDecimal productPrice;
    private Integer quantity;
    private Long variationId;
    private Long variantCombinationId;
    private String variant;
    private ProductVariationResponse variation;
    private BigDecimal subtotal;
    private Long createdAtTimestamp;
    private Long updatedAtTimestamp;
}
