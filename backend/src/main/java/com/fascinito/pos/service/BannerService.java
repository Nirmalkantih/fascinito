package com.fascinito.pos.service;

import com.fascinito.pos.dto.banner.BannerRequest;
import com.fascinito.pos.dto.banner.BannerResponse;
import com.fascinito.pos.entity.Banner;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BannerService {

    private final BannerRepository bannerRepository;

    /**
     * Get all banners with pagination
     */
    @Transactional(readOnly = true)
    public Page<BannerResponse> getAllBanners(Pageable pageable) {
        return bannerRepository.findAll(pageable).map(this::mapToResponse);
    }

    /**
     * Get all active banners for carousel display (ordered by display order)
     */
    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findByActiveTrueOrderByDisplayOrder()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Get banner by ID
     */
    @Transactional(readOnly = true)
    public BannerResponse getBannerById(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with id: " + id));
        return mapToResponse(banner);
    }

    /**
     * Create new banner
     */
    @Transactional
    public BannerResponse createBanner(BannerRequest request) {
        Banner banner = new Banner();
        mapRequestToEntity(request, banner);

        Banner savedBanner = bannerRepository.save(banner);
        log.info("Banner created: {}", savedBanner.getId());
        return mapToResponse(savedBanner);
    }

    /**
     * Update existing banner
     */
    @Transactional
    public BannerResponse updateBanner(Long id, BannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with id: " + id));

        mapRequestToEntity(request, banner);

        Banner savedBanner = bannerRepository.save(banner);
        log.info("Banner updated: {}", savedBanner.getId());
        return mapToResponse(savedBanner);
    }

    /**
     * Delete banner
     */
    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with id: " + id));

        bannerRepository.delete(banner);
        log.info("Banner deleted: {}", id);
    }

    /**
     * Update banner display order
     */
    @Transactional
    public void updateDisplayOrder(Long id, Integer displayOrder) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with id: " + id));

        banner.setDisplayOrder(displayOrder);
        bannerRepository.save(banner);
        log.info("Banner display order updated: {} -> {}", id, displayOrder);
    }

    private void mapRequestToEntity(BannerRequest request, Banner banner) {
        banner.setTitle(request.getTitle());
        banner.setSubtitle(request.getSubtitle());
        banner.setImageUrl(request.getImageUrl());
        banner.setBackgroundColor(request.getBackgroundColor());
        banner.setTextColor(request.getTextColor());
        banner.setCtaUrl(request.getCtaUrl());
        banner.setDisplayOrder(request.getDisplayOrder());
        banner.setActive(request.getActive());
    }

    private BannerResponse mapToResponse(Banner banner) {
        BannerResponse response = new BannerResponse();
        response.setId(banner.getId());
        response.setTitle(banner.getTitle());
        response.setSubtitle(banner.getSubtitle());
        response.setImageUrl(banner.getImageUrl());
        response.setBackgroundColor(banner.getBackgroundColor());
        response.setTextColor(banner.getTextColor());
        response.setCtaUrl(banner.getCtaUrl());
        response.setDisplayOrder(banner.getDisplayOrder());
        response.setActive(banner.getActive());
        response.setCreatedAt(banner.getCreatedAt());
        response.setUpdatedAt(banner.getUpdatedAt());
        return response;
    }
}
