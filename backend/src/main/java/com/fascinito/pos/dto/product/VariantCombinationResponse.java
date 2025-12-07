package com.fascinito.pos.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariantCombinationResponse {
    
    private Long id;
    private BigDecimal price;
    private Integer stock;
    private Boolean active;
    private List<Long> optionIds;  // IDs of variation options in this combination
    private String combinationName;  // e.g., "Red + Large"
}
