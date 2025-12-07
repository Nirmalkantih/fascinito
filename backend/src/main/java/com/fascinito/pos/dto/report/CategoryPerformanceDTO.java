package com.fascinito.pos.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryPerformanceDTO {
    private String categoryName;
    private Long salesCount;
    private Double revenue;
    private Double profit;
    private Double profitMargin;
}
