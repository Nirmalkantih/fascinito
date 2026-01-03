package com.fascinito.pos.controller;

import com.fascinito.pos.dto.CreateEmailCampaignRequest;
import com.fascinito.pos.dto.EmailCampaignRecipientResponse;
import com.fascinito.pos.dto.EmailCampaignResponse;
import com.fascinito.pos.dto.EmailCampaignStatsResponse;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.service.EmailCampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/email-campaigns")
@RequiredArgsConstructor
@Slf4j
public class EmailCampaignController {

    private final EmailCampaignService emailCampaignService;
    private final UserRepository userRepository;

    /**
     * Create a new email campaign with selected recipients
     * POST /admin/email-campaigns
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailCampaignResponse> createCampaign(
            @Valid @RequestBody CreateEmailCampaignRequest request) {
        log.info("Creating new email campaign: {}", request.getCampaignName());

        try {
            // Get current user from security context
            User creator = getCurrentUser();
            EmailCampaignResponse response = emailCampaignService.createCampaign(request, creator);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Failed to create email campaign: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Get campaign details by ID
     * GET /admin/email-campaigns/{campaignId}
     */
    @GetMapping("/{campaignId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailCampaignResponse> getCampaign(@PathVariable Long campaignId) {
        try {
            EmailCampaignResponse response = emailCampaignService.getCampaignById(campaignId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch campaign {}: {}", campaignId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * List campaigns created by current user
     * GET /admin/email-campaigns?page=0&size=10&sort=createdAt,desc
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<EmailCampaignResponse>> getCampaigns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        try {
            User currentUser = getCurrentUser();
            Sort.Direction direction = Sort.Direction.fromString(sortDirection.toUpperCase());
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            Page<EmailCampaignResponse> campaigns = emailCampaignService.getCampaignsByCreator(currentUser.getId(), pageable);
            return ResponseEntity.ok(campaigns);
        } catch (Exception e) {
            log.error("Failed to fetch campaigns: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * List campaigns by status (DRAFT, SCHEDULED, SENDING, COMPLETED, FAILED, PAUSED)
     * GET /admin/email-campaigns/status/{status}
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<EmailCampaignResponse>> getCampaignsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<EmailCampaignResponse> campaigns = emailCampaignService.getCampaignsByStatus(status, pageable);
            return ResponseEntity.ok(campaigns);
        } catch (Exception e) {
            log.error("Failed to fetch campaigns by status {}: {}", status, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get campaign statistics
     * GET /admin/email-campaigns/{campaignId}/stats
     */
    @GetMapping("/{campaignId}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailCampaignStatsResponse> getCampaignStats(@PathVariable Long campaignId) {
        try {
            EmailCampaignStatsResponse stats = emailCampaignService.getCampaignStats(campaignId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to fetch campaign stats for {}: {}", campaignId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get campaign recipients with pagination
     * GET /admin/email-campaigns/{campaignId}/recipients
     */
    @GetMapping("/{campaignId}/recipients")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<EmailCampaignRecipientResponse>> getCampaignRecipients(
            @PathVariable Long campaignId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
            Page<EmailCampaignRecipientResponse> recipients = emailCampaignService.getCampaignRecipients(campaignId, pageable);
            return ResponseEntity.ok(recipients);
        } catch (Exception e) {
            log.error("Failed to fetch recipients for campaign {}: {}", campaignId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get campaign recipients by status (PENDING, SENT, FAILED, BOUNCED, COMPLAINED, UNSUBSCRIBED)
     * GET /admin/email-campaigns/{campaignId}/recipients/status/{status}
     */
    @GetMapping("/{campaignId}/recipients/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<EmailCampaignRecipientResponse>> getCampaignRecipientsByStatus(
            @PathVariable Long campaignId,
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
            Page<EmailCampaignRecipientResponse> recipients = emailCampaignService.getCampaignRecipientsByStatus(campaignId, status, pageable);
            return ResponseEntity.ok(recipients);
        } catch (Exception e) {
            log.error("Failed to fetch recipients for campaign {} with status {}: {}", campaignId, status, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update campaign status
     * PATCH /admin/email-campaigns/{campaignId}/status
     */
    @PatchMapping("/{campaignId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateCampaignStatus(
            @PathVariable Long campaignId,
            @RequestParam String status) {
        try {
            emailCampaignService.updateCampaignStatus(campaignId, status);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to update campaign {} status: {}", campaignId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Pause campaign (stop sending pending emails)
     * PATCH /admin/email-campaigns/{campaignId}/pause
     */
    @PatchMapping("/{campaignId}/pause")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> pauseCampaign(@PathVariable Long campaignId) {
        try {
            emailCampaignService.pauseCampaign(campaignId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to pause campaign {}: {}", campaignId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Resume paused campaign
     * PATCH /admin/email-campaigns/{campaignId}/resume
     */
    @PatchMapping("/{campaignId}/resume")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resumeCampaign(@PathVariable Long campaignId) {
        try {
            emailCampaignService.resumeCampaign(campaignId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to resume campaign {}: {}", campaignId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete campaign
     * DELETE /admin/email-campaigns/{campaignId}
     */
    @DeleteMapping("/{campaignId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCampaign(@PathVariable Long campaignId) {
        try {
            emailCampaignService.deleteCampaign(campaignId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete campaign {}: {}", campaignId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get current authenticated user from security context
     */
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(username)
                .or(() -> userRepository.findByPhone(username))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
