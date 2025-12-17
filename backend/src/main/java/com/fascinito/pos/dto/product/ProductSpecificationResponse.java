package com.fascinito.pos.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSpecificationResponse {
    private Long id;
    private String attributeName;
    private String attributeValue;
    private Integer displayOrder;
}
