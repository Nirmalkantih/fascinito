package com.fascinito.pos.service;

import com.fascinito.pos.entity.EmailCampaign;
import com.fascinito.pos.entity.EmailCampaignRecipient;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.repository.EmailCampaignRecipientRepository;
import com.fascinito.pos.repository.EmailCampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailCampaignProcessor {

    private final EmailCampaignRepository emailCampaignRepository;
    private final EmailCampaignRecipientRepository emailCampaignRecipientRepository;
    private final EmailCampaignService emailCampaignService;
    private final MailService mailService;
    private final EmailTemplateService emailTemplateService;

    @Value("${email.campaign.batch-size:10}")
    private Integer batchSize;

    @Value("${email.campaign.delay-between-batches:1000}")
    private Long delayBetweenBatches;

    /**
     * Check for scheduled campaigns every minute and send them
     * This runs every 60 seconds
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    @Transactional
    public void processScheduledCampaigns() {
        log.debug("Processing scheduled campaigns");

        try {
            List<EmailCampaign> scheduledCampaigns = emailCampaignService.getScheduledCampaignsToSend();

            if (scheduledCampaigns.isEmpty()) {
                log.debug("No scheduled campaigns to process");
                return;
            }

            log.info("Found {} campaigns ready to send", scheduledCampaigns.size());

            for (EmailCampaign campaign : scheduledCampaigns) {
                log.info("Starting sending for campaign: {} (ID: {})", campaign.getCampaignName(), campaign.getId());
                sendCampaign(campaign);
            }
        } catch (Exception e) {
            log.error("Error processing scheduled campaigns: {}", e.getMessage(), e);
        }
    }

    /**
     * Send campaign asynchronously
     */
    @Async("taskExecutor")
    public void sendCampaign(EmailCampaign campaign) {
        try {
            log.info("Async sending started for campaign: {} (ID: {})", campaign.getCampaignName(), campaign.getId());

            // Update campaign status to SENDING
            campaign.setStatus(EmailCampaign.CampaignStatus.SENDING);
            emailCampaignRepository.save(campaign);

            // Get all pending recipients
            List<EmailCampaignRecipient> pendingRecipients = emailCampaignService.getPendingRecipients(campaign.getId());

            if (pendingRecipients.isEmpty()) {
                log.info("No pending recipients for campaign: {}", campaign.getId());
                campaign.setStatus(EmailCampaign.CampaignStatus.COMPLETED);
                emailCampaignRepository.save(campaign);
                return;
            }

            log.info("Processing {} pending recipients for campaign: {}", pendingRecipients.size(), campaign.getId());

            // Process recipients in batches to avoid overwhelming the mail server
            int totalSent = 0;
            int totalFailed = 0;

            for (int i = 0; i < pendingRecipients.size(); i += batchSize) {
                int end = Math.min(i + batchSize, pendingRecipients.size());
                List<EmailCampaignRecipient> batch = pendingRecipients.subList(i, end);

                log.info("Processing batch {}-{} of {} for campaign: {}",
                        i + 1, end, pendingRecipients.size(), campaign.getId());

                for (EmailCampaignRecipient recipient : batch) {
                    try {
                        sendEmailToRecipient(campaign, recipient);
                        totalSent++;
                    } catch (Exception e) {
                        log.error("Failed to send email to recipient {}: {}", recipient.getId(), e.getMessage());
                        emailCampaignService.markRecipientAsFailed(recipient.getId(), e.getMessage());
                        totalFailed++;
                    }
                }

                // Add delay between batches to avoid overwhelming the mail server
                if (i + batchSize < pendingRecipients.size()) {
                    try {
                        Thread.sleep(delayBetweenBatches);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        log.warn("Batch processing interrupted: {}", e.getMessage());
                        break;
                    }
                }
            }

            // Update campaign status based on results
            if (totalFailed == 0) {
                campaign.setStatus(EmailCampaign.CampaignStatus.COMPLETED);
                log.info("Campaign {} completed successfully. Sent: {}, Failed: {}",
                        campaign.getId(), totalSent, totalFailed);
            } else {
                campaign.setStatus(EmailCampaign.CampaignStatus.COMPLETED);
                log.warn("Campaign {} completed with errors. Sent: {}, Failed: {}",
                        campaign.getId(), totalSent, totalFailed);
            }

            emailCampaignRepository.save(campaign);
            log.info("Async sending completed for campaign: {} (ID: {})", campaign.getCampaignName(), campaign.getId());

        } catch (Exception e) {
            log.error("Fatal error processing campaign {}: {}", campaign.getId(), e.getMessage(), e);
            campaign.setStatus(EmailCampaign.CampaignStatus.FAILED);
            emailCampaignRepository.save(campaign);
        }
    }

    /**
     * Send email to a single recipient
     */
    private void sendEmailToRecipient(EmailCampaign campaign, EmailCampaignRecipient recipient) throws Exception {
        log.debug("Sending email to recipient: {} ({})", recipient.getId(), recipient.getEmail());

        try {
            // Create a temporary Order object for template variable processing
            // In a real scenario, you might have actual order context
            Order templateContext = createTemplateContext(recipient);

            // Process the campaign body with template variables
            String processedBody = emailTemplateService.processTemplate(campaign.getBody(), templateContext);
            String processedSubject = emailTemplateService.processTemplate(campaign.getSubject(), templateContext);

            // Send email
            mailService.sendHtmlEmail(recipient.getEmail(), processedSubject, processedBody);

            // Mark as sent
            emailCampaignService.markRecipientAsSent(recipient.getId());
            log.info("Email sent successfully to: {}", recipient.getEmail());

        } catch (Exception e) {
            log.error("Exception while sending email to {}: {}", recipient.getEmail(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Create a template context object for variable replacement
     * This creates a mock Order with recipient information
     */
    private Order createTemplateContext(EmailCampaignRecipient recipient) {
        Order order = new Order();
        order.setOrderNumber("CAMPAIGN-" + System.currentTimeMillis());
        order.setCreatedAt(LocalDateTime.now());

        // Set user information from recipient
        order.setUser(recipient.getCustomer());

        // Set default values for other order fields
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setShippingAddress(recipient.getCustomer().getFirstName() + " " + recipient.getCustomer().getLastName());
        order.setBillingAddress(recipient.getCustomer().getFirstName() + " " + recipient.getCustomer().getLastName());

        return order;
    }

    /**
     * Retry failed email sends (can be scheduled separately)
     */
    @Scheduled(cron = "0 0 2 * * *") // Run at 2 AM daily
    @Transactional
    public void retryFailedEmails() {
        log.info("Starting retry of failed emails");

        try {
            // Get all campaigns with failed recipients
            List<EmailCampaign> campaigns = emailCampaignRepository.findAll();

            int totalRetried = 0;

            for (EmailCampaign campaign : campaigns) {
                List<EmailCampaignRecipient> failedRecipients =
                    emailCampaignRecipientRepository.findByCampaignIdAndStatus(
                        campaign.getId(),
                        EmailCampaignRecipient.RecipientStatus.FAILED
                    );

                for (EmailCampaignRecipient recipient : failedRecipients) {
                    try {
                        log.info("Retrying failed email to: {}", recipient.getEmail());
                        // Reset status to pending for retry
                        recipient.setStatus(EmailCampaignRecipient.RecipientStatus.PENDING);
                        recipient.setErrorMessage(null);
                        emailCampaignRecipientRepository.save(recipient);

                        sendEmailToRecipient(campaign, recipient);
                        totalRetried++;
                    } catch (Exception e) {
                        log.warn("Retry failed for recipient {}: {}", recipient.getId(), e.getMessage());
                    }
                }
            }

            log.info("Retry completed. Total retried: {}", totalRetried);

        } catch (Exception e) {
            log.error("Error during retry of failed emails: {}", e.getMessage(), e);
        }
    }

    /**
     * Clean up old completed campaigns (can be scheduled)
     */
    @Scheduled(cron = "0 0 3 * * *") // Run at 3 AM daily
    @Transactional
    public void cleanupOldCampaigns() {
        log.info("Starting cleanup of old campaigns");

        try {
            // Keep campaigns for 30 days
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

            // Find completed campaigns older than 30 days
            List<EmailCampaign> oldCampaigns = emailCampaignRepository.findAll()
                    .stream()
                    .filter(c -> c.getStatus() == EmailCampaign.CampaignStatus.COMPLETED)
                    .filter(c -> c.getUpdatedAt().isBefore(thirtyDaysAgo))
                    .toList();

            if (!oldCampaigns.isEmpty()) {
                log.info("Found {} old campaigns to archive/delete", oldCampaigns.size());
                // In production, you might want to archive instead of delete
                // For now, we'll just log them
                oldCampaigns.forEach(c -> log.info("Campaign {} from {} is eligible for cleanup",
                    c.getId(), c.getCreatedAt()));
            }

        } catch (Exception e) {
            log.error("Error during cleanup of old campaigns: {}", e.getMessage(), e);
        }
    }
}
