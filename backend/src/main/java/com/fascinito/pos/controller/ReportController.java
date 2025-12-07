package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.report.*;
import com.fascinito.pos.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<ReportSummaryDTO>> getReportSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        log.info("GET /reports/summary - from {} to {}", startDate, endDate);
        
        ReportSummaryDTO summary = reportService.getReportSummary(startDate, endDate);
        
        return ResponseEntity.ok(ApiResponse.success("Report summary retrieved successfully", summary));
    }

    @GetMapping("/sales")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<SalesReportDTO>>> getSalesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        log.info("GET /reports/sales - from {} to {}", startDate, endDate);
        
        List<SalesReportDTO> sales = reportService.getSalesReport(startDate, endDate);
        
        return ResponseEntity.ok(ApiResponse.success("Sales report retrieved successfully", sales));
    }

    @GetMapping("/inventory")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<InventoryReportDTO>>> getInventoryReport() {
        
        log.info("GET /reports/inventory");
        
        List<InventoryReportDTO> inventory = reportService.getInventoryReport();
        
        return ResponseEntity.ok(ApiResponse.success("Inventory report retrieved successfully", inventory));
    }

    @GetMapping("/category-performance")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<CategoryPerformanceDTO>>> getCategoryPerformance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        log.info("GET /reports/category-performance - from {} to {}", startDate, endDate);
        
        List<CategoryPerformanceDTO> performance = reportService.getCategoryPerformance(startDate, endDate);
        
        return ResponseEntity.ok(ApiResponse.success("Category performance report retrieved successfully", performance));
    }
}
