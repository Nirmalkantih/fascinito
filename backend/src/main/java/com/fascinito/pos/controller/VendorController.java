package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.vendor.VendorRequest;
import com.fascinito.pos.dto.vendor.VendorResponse;
import com.fascinito.pos.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/vendors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VendorController {

    private final VendorService vendorService;

    @GetMapping
    public ResponseEntity<PageResponse<VendorResponse>> getAllVendors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<VendorResponse> vendors = vendorService.getAllVendors(pageable, search, active);
        
        PageResponse<VendorResponse> response = PageResponse.<VendorResponse>builder()
                .content(vendors.getContent())
                .pageNumber(vendors.getNumber())
                .pageSize(vendors.getSize())
                .totalElements(vendors.getTotalElements())
                .totalPages(vendors.getTotalPages())
                .last(vendors.isLast())
                .first(vendors.isFirst())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<VendorResponse>>> getAllActiveVendors() {
        List<VendorResponse> vendors = vendorService.getAllActiveVendors();
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Active vendors retrieved successfully",
                vendors,
                LocalDateTime.now()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VendorResponse>> getVendorById(@PathVariable Long id) {
        VendorResponse vendor = vendorService.getVendorById(id);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Vendor retrieved successfully",
                vendor,
                LocalDateTime.now()
        ));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<VendorResponse>> createVendor(
            @Valid @RequestBody VendorRequest request) {
        VendorResponse vendor = vendorService.createVendor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(
                true,
                "Vendor created successfully",
                vendor,
                LocalDateTime.now()
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<VendorResponse>> updateVendor(
            @PathVariable Long id,
            @Valid @RequestBody VendorRequest request) {
        VendorResponse vendor = vendorService.updateVendor(id, request);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Vendor updated successfully",
                vendor,
                LocalDateTime.now()
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteVendor(@PathVariable Long id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Vendor deleted successfully",
                null,
                LocalDateTime.now()
        ));
    }
}
