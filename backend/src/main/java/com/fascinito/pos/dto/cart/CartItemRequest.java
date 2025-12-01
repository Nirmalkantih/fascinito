package com.fascinito.pos.dto.cart;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemRequest {
    @JsonProperty("productId")
    private Long productId;
    
    @JsonProperty("variationId")
    private Long variationId;  // Optional: for product variants
    
    @JsonProperty("quantity")
    private Integer quantity;
}
