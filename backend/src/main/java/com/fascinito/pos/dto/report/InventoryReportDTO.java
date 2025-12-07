package com.fascinito.pos.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReportDTO {
    private String productName;
    private String categoryName;
    private Integer stockQuantity;
    private Integer minStockLevel;
    private Double productValue;
    private String status; // "In Stock", "Low Stock", "Critical", "Out of Stock"
}
