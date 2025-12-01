package com.fascinito.pos.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VariationOptionRequest {

    private Long id;  // ID for updating existing options, null for new ones

    @NotBlank(message = "Option name is required")
    @Size(max = 100, message = "Option name must not exceed 100 characters")
    private String name;  // e.g., "Red", "Small", "XL"

    private BigDecimal priceAdjustment = BigDecimal.ZERO;  // Price adjustment for this option

    @Min(value = 0, message = "Stock quantity must be 0 or greater")
    private Integer stockQuantity = 0;  // Stock for this specific option

    @Size(max = 100, message = "SKU must not exceed 100 characters")
    private String sku;  // Unique SKU for this option

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;  // Image for this specific option

    private Boolean active = true;
}
