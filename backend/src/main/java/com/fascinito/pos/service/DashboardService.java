package com.fascinito.pos.service;

import com.fascinito.pos.dto.dashboard.DashboardStatsResponse;
import com.fascinito.pos.entity.Role;
import com.fascinito.pos.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final VendorRepository vendorRepository;
    private final LocationRepository locationRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        log.debug("Fetching dashboard statistics");

        DashboardStatsResponse stats = new DashboardStatsResponse();
        
        // Count basic entities
        stats.setTotalProducts(productRepository.count());
        stats.setTotalCategories(categoryRepository.count());
        stats.setTotalVendors(vendorRepository.count());
        stats.setTotalLocations(locationRepository.count());
        stats.setTotalOrders(orderRepository.count());
        
        // Count customers (users with ROLE_CUSTOMER)
        long customerCount = userRepository.findAll().stream()
                .filter(user -> user.getRoles().stream()
                        .anyMatch(role -> role.getName() == Role.RoleType.ROLE_CUSTOMER))
                .count();
        stats.setTotalCustomers(customerCount);
        
        // Calculate financial metrics from orders
        var orders = orderRepository.findAll();
        double totalRevenue = orders.stream()
                .mapToDouble(order -> order.getTotalAmount().doubleValue())
                .sum();
        
        // For now, set profit as 20% of revenue (can be adjusted based on actual cost data)
        double totalProfit = totalRevenue * 0.20;
        double totalSpending = totalRevenue - totalProfit;
        
        stats.setTotalRevenue(totalRevenue);
        stats.setTotalProfit(totalProfit);
        stats.setTotalSpending(totalSpending);
        
        log.debug("Dashboard stats: {}", stats);
        return stats;
    }
}
