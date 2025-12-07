package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.dashboard.*;
import com.fascinito.pos.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        log.info("GET /dashboard/stats - Fetching dashboard statistics");
        
        DashboardStatsResponse stats = dashboardService.getDashboardStats();
        
        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved successfully", stats));
    }

    @GetMapping("/location-analytics")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<LocationAnalyticsDTO>>> getLocationAnalytics() {
        log.info("GET /dashboard/location-analytics - Fetching location analytics");
        
        List<LocationAnalyticsDTO> analytics = dashboardService.getLocationAnalytics();
        
        return ResponseEntity.ok(ApiResponse.success("Location analytics retrieved successfully", analytics));
    }

    @GetMapping("/category-distribution")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<CategoryDistributionDTO>>> getCategoryDistribution() {
        log.info("GET /dashboard/category-distribution - Fetching category distribution");
        
        List<CategoryDistributionDTO> distribution = dashboardService.getCategoryDistribution();
        
        return ResponseEntity.ok(ApiResponse.success("Category distribution retrieved successfully", distribution));
    }

    @GetMapping("/monthly-trend")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<MonthlyTrendDTO>>> getMonthlyTrend() {
        log.info("GET /dashboard/monthly-trend - Fetching monthly trend");
        
        List<MonthlyTrendDTO> trend = dashboardService.getMonthlyTrend();
        
        return ResponseEntity.ok(ApiResponse.success("Monthly trend retrieved successfully", trend));
    }
}
