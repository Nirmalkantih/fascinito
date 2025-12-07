package com.fascinito.pos.service;

import com.fascinito.pos.dto.report.*;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.entity.OrderItem;
import com.fascinito.pos.entity.Product;
import com.fascinito.pos.repository.OrderRepository;
import com.fascinito.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public ReportSummaryDTO getReportSummary(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating report summary from {} to {}", startDate, endDate);
        
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDate, endDate);
        
        double totalRevenue = 0.0;
        double totalCost = 0.0;
        long totalItems = 0;
        
        for (Order order : orders) {
            totalRevenue += order.getTotalAmount().doubleValue();
            
            for (OrderItem item : order.getItems()) {
                totalItems += item.getQuantity();
                
                // Calculate cost - matching Dashboard logic
                Product product = item.getProduct();
                if (product != null) {
                    if (product.getCostPerItem() != null) {
                        // Use actual product cost
                        totalCost += product.getCostPerItem().doubleValue() * item.getQuantity();
                    } else {
                        // Fallback: estimate cost as 80% of item revenue (20% profit margin)
                        // Use actual sold price (item.getTotalPrice()), not catalog price
                        double itemRevenue = item.getTotalPrice().doubleValue();
                        totalCost += itemRevenue * 0.80;
                    }
                }
            }
        }
        
        double totalProfit = totalRevenue - totalCost;
        double avgOrderValue = orders.isEmpty() ? 0.0 : totalRevenue / orders.size();
        double profitMargin = (totalRevenue > 0) ? (totalProfit / totalRevenue) * 100 : 0.0;
        
        return ReportSummaryDTO.builder()
                .totalRevenue(totalRevenue)
                .totalProfit(totalProfit)
                .totalOrders((long) orders.size())
                .itemsSold(totalItems)
                .avgOrderValue(avgOrderValue)
                .profitMargin(profitMargin)
                .build();
    }

    @Transactional(readOnly = true)
    public List<SalesReportDTO> getSalesReport(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating sales report from {} to {}", startDate, endDate);
        
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDate, endDate);
        List<SalesReportDTO> salesReports = new ArrayList<>();
        
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product == null) continue;
                
                // Revenue is the actual price paid by customer
                double revenue = item.getTotalPrice().doubleValue();
                
                // Calculate cost - matching Dashboard logic
                double cost;
                if (product.getCostPerItem() != null) {
                    // Use actual product cost
                    cost = product.getCostPerItem().doubleValue() * item.getQuantity();
                } else {
                    // Fallback: estimate cost as 80% of item revenue (20% profit margin)
                    cost = revenue * 0.80;
                }
                
                double profit = revenue - cost;
                
                SalesReportDTO report = SalesReportDTO.builder()
                        .date(order.getCreatedAt())
                        .productName(product.getTitle())
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : "Uncategorized")
                        .quantity(item.getQuantity())
                        .revenue(revenue)
                        .profit(profit)
                        .orderNumber(order.getOrderNumber())
                        .build();
                
                salesReports.add(report);
            }
        }
        
        // Sort by date descending
        salesReports.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        
        return salesReports;
    }

    @Transactional(readOnly = true)
    public List<InventoryReportDTO> getInventoryReport() {
        log.info("Generating inventory report");
        
        List<Product> products = productRepository.findAll();
        List<InventoryReportDTO> inventoryReports = new ArrayList<>();
        
        for (Product product : products) {
            int stock = product.getStockQuantity();
            int minStock = product.getLowStockThreshold();
            double value = product.getRegularPrice().doubleValue() * stock;
            
            String status;
            if (stock == 0) {
                status = "Out of Stock";
            } else if (stock < minStock * 0.5) {
                status = "Critical";
            } else if (stock < minStock) {
                status = "Low Stock";
            } else {
                status = "In Stock";
            }
            
            InventoryReportDTO report = InventoryReportDTO.builder()
                    .productName(product.getTitle())
                    .categoryName(product.getCategory() != null ? product.getCategory().getName() : "Uncategorized")
                    .stockQuantity(stock)
                    .minStockLevel(minStock)
                    .productValue(value)
                    .status(status)
                    .build();
            
            inventoryReports.add(report);
        }
        
        // Sort by stock quantity ascending (show critical items first)
        inventoryReports.sort(Comparator.comparingInt(InventoryReportDTO::getStockQuantity));
        
        return inventoryReports;
    }

    @Transactional(readOnly = true)
    public List<CategoryPerformanceDTO> getCategoryPerformance(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating category performance report from {} to {}", startDate, endDate);
        
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDate, endDate);
        
        // Group by category
        Map<String, CategoryPerformanceData> categoryMap = new HashMap<>();
        
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product == null) continue;
                
                String categoryName = (product.getCategory() != null) 
                    ? product.getCategory().getName() 
                    : "Uncategorized";
                
                // Revenue is the actual price paid by customer
                double revenue = item.getTotalPrice().doubleValue();
                
                // Calculate cost - matching Dashboard logic
                double cost;
                if (product.getCostPerItem() != null) {
                    // Use actual product cost
                    cost = product.getCostPerItem().doubleValue() * item.getQuantity();
                } else {
                    // Fallback: estimate cost as 80% of item revenue (20% profit margin)
                    cost = revenue * 0.80;
                }
                
                double profit = revenue - cost;
                
                CategoryPerformanceData data = categoryMap.getOrDefault(categoryName, new CategoryPerformanceData());
                data.revenue += revenue;
                data.profit += profit;
                data.salesCount += item.getQuantity();
                
                categoryMap.put(categoryName, data);
            }
        }
        
        // Convert to DTO list
        List<CategoryPerformanceDTO> result = categoryMap.entrySet().stream()
                .map(entry -> {
                    CategoryPerformanceData data = entry.getValue();
                    double profitMargin = (data.revenue > 0) ? (data.profit / data.revenue) * 100 : 0.0;
                    
                    return CategoryPerformanceDTO.builder()
                            .categoryName(entry.getKey())
                            .salesCount(data.salesCount)
                            .revenue(data.revenue)
                            .profit(data.profit)
                            .profitMargin(profitMargin)
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getRevenue(), a.getRevenue()))
                .collect(Collectors.toList());
        
        return result;
    }

    // Helper class for category aggregation
    private static class CategoryPerformanceData {
        long salesCount = 0;
        double revenue = 0.0;
        double profit = 0.0;
    }
}
