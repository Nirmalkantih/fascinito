package com.fascinito.pos.service;

import com.fascinito.pos.dto.CreateEmailCampaignRequest;
import com.fascinito.pos.dto.EmailCampaignRecipientResponse;
import com.fascinito.pos.dto.EmailCampaignResponse;
import com.fascinito.pos.dto.EmailCampaignStatsResponse;
import com.fascinito.pos.entity.EmailCampaign;
import com.fascinito.pos.entity.EmailCampaignRecipient;
import com.fascinito.pos.entity.EmailTemplate;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.repository.EmailCampaignRecipientRepository;
import com.fascinito.pos.repository.EmailCampaignRepository;
import com.fascinito.pos.repository.EmailTemplateRepository;
import com.fascinito.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.Executor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailCampaignService {

    private final EmailCampaignRepository emailCampaignRepository;
    private final EmailCampaignRecipientRepository emailCampaignRecipientRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final UserRepository userRepository;
    private final EmailTemplateService emailTemplateService;
    private final ObjectProvider<EmailCampaignProcessor> emailCampaignProcessorProvider;
    private final Executor taskExecutor;

    /**
     * Create a new email campaign with selected recipients
     */
    public EmailCampaignResponse createCampaign(CreateEmailCampaignRequest request, User creator) {
        log.info("Creating email campaign: {} by user: {}", request.getCampaignName(), creator.getId());

        // Fetch template
        EmailTemplate template = emailTemplateRepository.findById(request.getTemplateId())
                .orElseThrow(() -> new RuntimeException("Email template not found with ID: " + request.getTemplateId()));

        // Fetch all recipient users
        List<User> recipients = userRepository.findAllById(request.getRecipientIds());
        if (recipients.isEmpty()) {
            throw new RuntimeException("No valid recipients found for the provided IDs");
        }

        if (recipients.size() != request.getRecipientIds().size()) {
            log.warn("Some recipient IDs were not found. Expected: {}, Found: {}",
                    request.getRecipientIds().size(), recipients.size());
        }

        // Create campaign
        EmailCampaign campaign = EmailCampaign.builder()
                .campaignName(request.getCampaignName())
                .template(template)
                .subject(request.getSubject())
                .body(request.getBody())
                .targetType(EmailCampaign.TargetType.valueOf(request.getTargetType()))
                .createdBy(creator)
                .totalRecipients(recipients.size())
                .sentCount(0)
                .failedCount(0)
                .build();

        // Set status based on sendImmediately or scheduling
        if (Boolean.TRUE.equals(request.getSendImmediately())) {
            campaign.setStatus(EmailCampaign.CampaignStatus.SENDING);
        } else if (request.getScheduledAt() != null) {
            campaign.setScheduledAt(request.getScheduledAt());
            campaign.setStatus(EmailCampaign.CampaignStatus.SCHEDULED);
        } else {
            campaign.setStatus(EmailCampaign.CampaignStatus.DRAFT);
        }

        // Save campaign
        campaign = emailCampaignRepository.save(campaign);
        log.info("Campaign created with ID: {}", campaign.getId());

        // Create recipient entries
        final EmailCampaign savedCampaign = campaign;
        List<EmailCampaignRecipient> campaignRecipients = recipients.stream()
                .map(user -> EmailCampaignRecipient.builder()
                        .campaign(savedCampaign)
                        .customer(user)
                        .email(user.getEmail())
                        .status(EmailCampaignRecipient.RecipientStatus.PENDING)
                        .build())
                .collect(Collectors.toList());

        emailCampaignRecipientRepository.saveAll(campaignRecipients);
        log.info("Created {} recipient entries for campaign {}", campaignRecipients.size(), campaign.getId());

        // Trigger async email sending if sendImmediately is true
        if (Boolean.TRUE.equals(request.getSendImmediately())) {
            log.info("Triggering async email sending for campaign {}", campaign.getId());
            try {
                final EmailCampaignProcessor processor = emailCampaignProcessorProvider.getObject();
                final EmailCampaign campaignToSend = campaign;
                // Submit the async task to the thread pool
                taskExecutor.execute(() -> processor.sendCampaign(campaignToSend));
            } catch (Exception e) {
                log.error("Failed to trigger email campaign sending: {}", e.getMessage());
            }
        }

        return mapToResponse(campaign);
    }

    /**
     * Get campaign by ID with full details
     */
    @Transactional(readOnly = true)
    public EmailCampaignResponse getCampaignById(Long campaignId) {
        EmailCampaign campaign = emailCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found with ID: " + campaignId));
        return mapToResponse(campaign);
    }

    /**
     * List campaigns created by a specific user
     */
    @Transactional(readOnly = true)
    public Page<EmailCampaignResponse> getCampaignsByCreator(Long userId, Pageable pageable) {
        Page<EmailCampaign> campaigns = emailCampaignRepository.findByCreatedByIdOrderByCreatedAtDesc(userId, pageable);
        return campaigns.map(this::mapToResponse);
    }

    /**
     * List campaigns by status
     */
    @Transactional(readOnly = true)
    public Page<EmailCampaignResponse> getCampaignsByStatus(String status, Pageable pageable) {
        EmailCampaign.CampaignStatus campaignStatus = EmailCampaign.CampaignStatus.valueOf(status.toUpperCase());
        Page<EmailCampaign> campaigns = emailCampaignRepository.findByStatusOrderByCreatedAtDesc(campaignStatus, pageable);
        return campaigns.map(this::mapToResponse);
    }

    /**
     * Get campaign statistics
     */
    @Transactional(readOnly = true)
    public EmailCampaignStatsResponse getCampaignStats(Long campaignId) {
        EmailCampaign campaign = emailCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found with ID: " + campaignId));

        int sentCount = campaign.getSentCount();
        int failedCount = campaign.getFailedCount();
        int totalRecipients = campaign.getTotalRecipients();
        int pendingCount = totalRecipients - sentCount - failedCount;

        double successRate = totalRecipients > 0 ? ((double) sentCount / totalRecipients) * 100 : 0;
        double failureRate = totalRecipients > 0 ? ((double) failedCount / totalRecipients) * 100 : 0;

        return EmailCampaignStatsResponse.builder()
                .campaignId(campaignId)
                .totalRecipients(totalRecipients)
                .sentCount(sentCount)
                .failedCount(failedCount)
                .pendingCount(pendingCount)
                .successRate(successRate)
                .failureRate(failureRate)
                .status(campaign.getStatus().toString())
                .build();
    }

    /**
     * Get campaign recipients with pagination
     */
    @Transactional(readOnly = true)
    public Page<EmailCampaignRecipientResponse> getCampaignRecipients(Long campaignId, Pageable pageable) {
        Page<EmailCampaignRecipient> recipients = emailCampaignRecipientRepository.findByCampaignId(campaignId, pageable);
        return recipients.map(this::mapRecipientToResponse);
    }

    /**
     * Get campaign recipients by status
     */
    @Transactional(readOnly = true)
    public Page<EmailCampaignRecipientResponse> getCampaignRecipientsByStatus(Long campaignId, String status, Pageable pageable) {
        EmailCampaignRecipient.RecipientStatus recipientStatus = EmailCampaignRecipient.RecipientStatus.valueOf(status.toUpperCase());
        Page<EmailCampaignRecipient> recipients = emailCampaignRecipientRepository.findByCampaignIdAndStatus(campaignId, recipientStatus, pageable);
        return recipients.map(this::mapRecipientToResponse);
    }

    /**
     * Update campaign status
     */
    public void updateCampaignStatus(Long campaignId, String newStatus) {
        EmailCampaign campaign = emailCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found with ID: " + campaignId));

        EmailCampaign.CampaignStatus status = EmailCampaign.CampaignStatus.valueOf(newStatus.toUpperCase());
        campaign.setStatus(status);
        emailCampaignRepository.save(campaign);

        log.info("Campaign {} status updated to: {}", campaignId, status);
    }

    /**
     * Update recipient delivery status (called by email processor)
     */
    public void updateRecipientStatus(Long recipientId, String status, String errorMessage) {
        EmailCampaignRecipient recipient = emailCampaignRecipientRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found with ID: " + recipientId));

        EmailCampaignRecipient.RecipientStatus recipientStatus = EmailCampaignRecipient.RecipientStatus.valueOf(status.toUpperCase());
        recipient.setStatus(recipientStatus);
        recipient.setErrorMessage(errorMessage);

        if (EmailCampaignRecipient.RecipientStatus.SENT == recipientStatus) {
            recipient.setSentAt(LocalDateTime.now());
        }

        emailCampaignRecipientRepository.save(recipient);
    }

    /**
     * Mark recipient as sent with timestamp
     */
    public void markRecipientAsSent(Long recipientId) {
        EmailCampaignRecipient recipient = emailCampaignRecipientRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found with ID: " + recipientId));

        recipient.setStatus(EmailCampaignRecipient.RecipientStatus.SENT);
        recipient.setSentAt(LocalDateTime.now());
        emailCampaignRecipientRepository.save(recipient);

        // Update campaign sent count
        EmailCampaign campaign = recipient.getCampaign();
        campaign.setSentCount(campaign.getSentCount() + 1);
        emailCampaignRepository.save(campaign);
    }

    /**
     * Mark recipient as failed
     */
    public void markRecipientAsFailed(Long recipientId, String errorMessage) {
        EmailCampaignRecipient recipient = emailCampaignRecipientRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found with ID: " + recipientId));

        recipient.setStatus(EmailCampaignRecipient.RecipientStatus.FAILED);
        recipient.setErrorMessage(errorMessage);
        emailCampaignRecipientRepository.save(recipient);

        // Update campaign failed count
        EmailCampaign campaign = recipient.getCampaign();
        campaign.setFailedCount(campaign.getFailedCount() + 1);
        emailCampaignRepository.save(campaign);
    }

    /**
     * Get pending recipients for a campaign (for email processor)
     */
    @Transactional(readOnly = true)
    public List<EmailCampaignRecipient> getPendingRecipients(Long campaignId) {
        return emailCampaignRecipientRepository.findPendingRecipientsByOrder(campaignId);
    }

    /**
     * Get all scheduled campaigns ready to send
     */
    @Transactional(readOnly = true)
    public List<EmailCampaign> getScheduledCampaignsToSend() {
        return emailCampaignRepository.findScheduledCampaignsToSend(LocalDateTime.now());
    }

    /**
     * Delete campaign and all related recipients
     */
    public void deleteCampaign(Long campaignId) {
        EmailCampaign campaign = emailCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found with ID: " + campaignId));

        emailCampaignRepository.delete(campaign);
        log.info("Campaign {} deleted successfully", campaignId);
    }

    /**
     * Pause campaign (stop sending pending emails)
     */
    public void pauseCampaign(Long campaignId) {
        EmailCampaign campaign = emailCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found with ID: " + campaignId));

        if (campaign.getStatus() == EmailCampaign.CampaignStatus.SENDING) {
            campaign.setStatus(EmailCampaign.CampaignStatus.PAUSED);
            emailCampaignRepository.save(campaign);
            log.info("Campaign {} paused", campaignId);
        } else {
            throw new RuntimeException("Only SENDING campaigns can be paused");
        }
    }

    /**
     * Resume paused campaign
     */
    public void resumeCampaign(Long campaignId) {
        EmailCampaign campaign = emailCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found with ID: " + campaignId));

        if (campaign.getStatus() == EmailCampaign.CampaignStatus.PAUSED) {
            campaign.setStatus(EmailCampaign.CampaignStatus.SENDING);
            emailCampaignRepository.save(campaign);
            log.info("Campaign {} resumed", campaignId);
        } else {
            throw new RuntimeException("Only PAUSED campaigns can be resumed");
        }
    }

    /**
     * Map entity to response DTO
     */
    private EmailCampaignResponse mapToResponse(EmailCampaign campaign) {
        int sentCount = campaign.getSentCount();
        int failedCount = campaign.getFailedCount();
        int totalRecipients = campaign.getTotalRecipients();
        int pendingCount = totalRecipients - sentCount - failedCount;
        double successRate = totalRecipients > 0 ? ((double) sentCount / totalRecipients) * 100 : 0;

        return EmailCampaignResponse.builder()
                .id(campaign.getId())
                .campaignName(campaign.getCampaignName())
                .templateId(campaign.getTemplate().getId())
                .templateName(campaign.getTemplate().getTemplateName())
                .subject(campaign.getSubject())
                .targetType(campaign.getTargetType().toString())
                .status(campaign.getStatus().toString())
                .scheduledAt(campaign.getScheduledAt())
                .totalRecipients(totalRecipients)
                .sentCount(sentCount)
                .failedCount(failedCount)
                .pendingCount(pendingCount)
                .successRate(successRate)
                .createdByName(campaign.getCreatedBy().getFirstName() + " " + campaign.getCreatedBy().getLastName())
                .createdById(campaign.getCreatedBy().getId())
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .build();
    }

    /**
     * Map recipient entity to response DTO
     */
    private EmailCampaignRecipientResponse mapRecipientToResponse(EmailCampaignRecipient recipient) {
        return EmailCampaignRecipientResponse.builder()
                .id(recipient.getId())
                .campaignId(recipient.getCampaign().getId())
                .customerId(recipient.getCustomer().getId())
                .customerName(recipient.getCustomer().getFirstName() + " " + recipient.getCustomer().getLastName())
                .email(recipient.getEmail())
                .status(recipient.getStatus().toString())
                .sentAt(recipient.getSentAt())
                .errorMessage(recipient.getErrorMessage())
                .createdAt(recipient.getCreatedAt())
                .build();
    }
}
