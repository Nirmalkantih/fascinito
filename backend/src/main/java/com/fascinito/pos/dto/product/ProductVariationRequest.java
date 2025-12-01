package com.fascinito.pos.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariationRequest {

    private Long id;  // ID for updating existing variations, null for new ones

    @NotBlank(message = "Variation type is required")
    @Size(max = 100, message = "Variation type must not exceed 100 characters")
    private String type;  // e.g., "Color", "Size", "Material"

    private Boolean active = true;

    @Valid
    private List<VariationOptionRequest> options;  // Specific choices for this variation type
}
