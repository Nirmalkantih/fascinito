package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.banner.BannerRequest;
import com.fascinito.pos.dto.banner.BannerResponse;
import com.fascinito.pos.service.BannerService;
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
@RequestMapping("/banners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BannerController {

    private final BannerService bannerService;

    /**
     * Get all banners with pagination (Admin)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<PageResponse<BannerResponse>> getAllBanners(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "displayOrder") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<BannerResponse> banners = bannerService.getAllBanners(pageable);

        PageResponse<BannerResponse> response = PageResponse.<BannerResponse>builder()
                .content(banners.getContent())
                .pageNumber(banners.getNumber())
                .pageSize(banners.getSize())
                .totalElements(banners.getTotalElements())
                .totalPages(banners.getTotalPages())
                .last(banners.isLast())
                .first(banners.isFirst())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Get all active banners for carousel display (Public)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getActiveBanners() {
        List<BannerResponse> banners = bannerService.getActiveBanners();
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Active banners retrieved successfully",
                banners,
                LocalDateTime.now()
        ));
    }

    /**
     * Get banner by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BannerResponse>> getBannerById(@PathVariable Long id) {
        BannerResponse banner = bannerService.getBannerById(id);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Banner retrieved successfully",
                banner,
                LocalDateTime.now()
        ));
    }

    /**
     * Create new banner (Admin)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<BannerResponse>> createBanner(
            @Valid @RequestBody BannerRequest request) {
        BannerResponse banner = bannerService.createBanner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(
                true,
                "Banner created successfully",
                banner,
                LocalDateTime.now()
        ));
    }

    /**
     * Update banner (Admin)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<BannerResponse>> updateBanner(
            @PathVariable Long id,
            @Valid @RequestBody BannerRequest request) {
        BannerResponse banner = bannerService.updateBanner(id, request);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Banner updated successfully",
                banner,
                LocalDateTime.now()
        ));
    }

    /**
     * Delete banner (Admin)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Banner deleted successfully",
                null,
                LocalDateTime.now()
        ));
    }

    /**
     * Update banner display order (Admin)
     */
    @PatchMapping("/{id}/order")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Void>> updateDisplayOrder(
            @PathVariable Long id,
            @RequestParam Integer displayOrder) {
        bannerService.updateDisplayOrder(id, displayOrder);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Banner display order updated successfully",
                null,
                LocalDateTime.now()
        ));
    }
}
