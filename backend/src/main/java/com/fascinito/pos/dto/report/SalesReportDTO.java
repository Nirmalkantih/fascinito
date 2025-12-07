package com.fascinito.pos.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesReportDTO {
    private LocalDateTime date;
    private String productName;
    private String categoryName;
    private Integer quantity;
    private Double revenue;
    private Double profit;
    private String orderNumber;
}
