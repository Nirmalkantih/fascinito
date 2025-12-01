package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.staff.StaffRequest;
import com.fascinito.pos.dto.staff.StaffResponse;
import com.fascinito.pos.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class StaffController {

    private final StaffService staffService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<StaffResponse>> getAllStaff(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active) {
        
        log.info("GET /staff - page: {}, size: {}, search: {}, active: {}", page, size, search, active);
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<StaffResponse> staffPage = staffService.getAllStaff(pageable, search, active);
        
        PageResponse<StaffResponse> response = PageResponse.<StaffResponse>builder()
            .content(staffPage.getContent())
            .totalElements(staffPage.getTotalElements())
            .pageNumber(staffPage.getNumber())
            .pageSize(staffPage.getSize())
            .totalPages(staffPage.getTotalPages())
            .first(staffPage.isFirst())
            .last(staffPage.isLast())
            .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> getStaffById(@PathVariable Long id) {
        log.info("GET /staff/{} - Fetching staff details", id);
        
        StaffResponse staff = staffService.getStaffById(id);
        
        return ResponseEntity.ok(ApiResponse.success("Staff retrieved successfully", staff));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff(@Valid @RequestBody StaffRequest request) {
        log.info("POST /staff - Creating new staff: {}", request.getEmail());
        
        StaffResponse staff = staffService.createStaff(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Staff created successfully", staff));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody StaffRequest request) {
        log.info("PUT /staff/{} - Updating staff", id);
        
        StaffResponse staff = staffService.updateStaff(id, request);
        
        return ResponseEntity.ok(ApiResponse.success("Staff updated successfully", staff));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(@PathVariable Long id) {
        log.info("DELETE /staff/{} - Deleting staff", id);
        
        staffService.deleteStaff(id);
        
        return ResponseEntity.ok(ApiResponse.<Void>success("Staff deleted successfully", null));
    }
}
