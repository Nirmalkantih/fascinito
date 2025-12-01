package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.customer.CustomerResponse;
import com.fascinito.pos.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<CustomerResponse>>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CustomerResponse> customers = customerService.getAllCustomers(pageable, search, active);
        
        PageResponse<CustomerResponse> pageResponse = PageResponse.<CustomerResponse>builder()
                .content(customers.getContent())
                .pageNumber(customers.getNumber())
                .pageSize(customers.getSize())
                .totalElements(customers.getTotalElements())
                .totalPages(customers.getTotalPages())
                .last(customers.isLast())
                .first(customers.isFirst())
                .build();
        
        return ResponseEntity.ok(
                ApiResponse.success("Customers retrieved successfully", pageResponse)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long id) {
        CustomerResponse customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(
                ApiResponse.success("Customer retrieved successfully", customer)
        );
    }

    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CustomerResponse>> toggleCustomerStatus(@PathVariable Long id) {
        CustomerResponse customer = customerService.toggleCustomerStatus(id);
        return ResponseEntity.ok(
                ApiResponse.success("Customer status updated successfully", customer)
        );
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Long>> getCustomerCount() {
        Long count = customerService.getCustomerCount();
        return ResponseEntity.ok(
                ApiResponse.success("Customer count retrieved successfully", count)
        );
    }
}
