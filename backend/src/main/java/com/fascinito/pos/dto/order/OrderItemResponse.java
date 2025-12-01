package com.fascinito.pos.dto.order;

import com.fascinito.pos.dto.product.ProductVariationResponse;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalPrice;
    private Long variationId;
    private ProductVariationResponse variation;
}
