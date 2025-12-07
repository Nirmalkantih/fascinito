package com.fascinito.pos.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryDTO {
    private Double totalRevenue;
    private Double totalProfit;
    private Long totalOrders;
    private Long itemsSold;
    private Double avgOrderValue;
    private Double profitMargin;
}
