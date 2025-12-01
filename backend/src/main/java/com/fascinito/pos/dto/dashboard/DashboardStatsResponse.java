package com.fascinito.pos.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalProducts;
    private Long totalCategories;
    private Long totalVendors;
    private Long totalLocations;
    private Long totalOrders;
    private Long totalCustomers;
    private Double totalRevenue;
    private Double totalProfit;
    private Double totalSpending;
}
