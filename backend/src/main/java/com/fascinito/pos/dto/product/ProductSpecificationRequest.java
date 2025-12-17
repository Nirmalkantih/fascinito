package com.fascinito.pos.dto.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSpecificationRequest {
    private String attributeName;
    private String attributeValue;
    private Integer displayOrder = 0;
}
