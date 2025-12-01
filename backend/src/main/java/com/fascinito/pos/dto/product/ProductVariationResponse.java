package com.fascinito.pos.dto.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariationResponse {

    private Long id;
    private String type;  // e.g., "Color", "Size", "Material"
    private Boolean active;
    private List<VariationOptionResponse> options;  // Specific choices for this variation type
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
