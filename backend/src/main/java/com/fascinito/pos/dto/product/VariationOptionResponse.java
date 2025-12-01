package com.fascinito.pos.dto.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VariationOptionResponse {

    private Long id;
    private String name;  // e.g., "Red", "Small", "XL"
    private BigDecimal priceAdjustment;
    private Integer stockQuantity;
    private String sku;
    private String imageUrl;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
