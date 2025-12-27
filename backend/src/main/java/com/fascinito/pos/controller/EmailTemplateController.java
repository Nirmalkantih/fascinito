package com.fascinito.pos.controller;

import com.fascinito.pos.dto.email.EmailTemplateResponse;
import com.fascinito.pos.dto.email.EmailTemplateUpdateRequest;
import com.fascinito.pos.dto.email.SendTestEmailRequest;
import com.fascinito.pos.entity.EmailTemplate;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.service.EmailTemplateService;
import com.fascinito.pos.service.MailService;
import com.fascinito.pos.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/email-templates")
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateController {
    private final EmailTemplateService emailTemplateService;
    private final MailService mailService;
    private final OrderService orderService;

    /**
     * Get all email templates (paginated)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<EmailTemplateResponse>> getAllTemplates(Pageable pageable) {
        log.info("Fetching all email templates");
        return ResponseEntity.ok(emailTemplateService.getAllTemplates(pageable));
    }

    /**
     * Get email template by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplateResponse> getTemplateById(@PathVariable Long id) {
        log.info("Fetching email template: {}", id);
        return ResponseEntity.ok(emailTemplateService.getTemplateById(id));
    }

    /**
     * Update email template
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @RequestBody EmailTemplateUpdateRequest request) {
        log.info("Updating email template: {}", id);
        EmailTemplateResponse updated = emailTemplateService.updateTemplate(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get available variables for email templates
     * Shows all available placeholders that can be used in templates
     */
    @GetMapping("/config/available-variables")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, String>>> getAvailableVariables() {
        log.info("Fetching available template variables");
        return ResponseEntity.ok(emailTemplateService.getAvailableVariables());
    }

    /**
     * Send test email with template preview
     * This allows admin to verify email content before applying to production
     */
    @PostMapping("/{id}/send-test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> sendTestEmail(
            @PathVariable Long id,
            @RequestBody SendTestEmailRequest request) {
        log.info("Sending test email for template: {} to {}", id, request.getRecipientEmail());

        try {
            // Get the template
            EmailTemplateResponse templateResponse = emailTemplateService.getTemplateById(id);

            // Create a sample order for variable replacement
            Order sampleOrder = Order.builder()
                    .orderNumber("ORD-TEST-123456")
                    .status(Order.OrderStatus.CONFIRMED)
                    .build();

            EmailTemplate template = EmailTemplate.builder()
                    .id(templateResponse.getId())
                    .templateKey(templateResponse.getTemplateKey())
                    .templateName(templateResponse.getTemplateName())
                    .subject(templateResponse.getSubject())
                    .bodyHtml(templateResponse.getBodyHtml())
                    .isActive(templateResponse.getIsActive())
                    .build();

            // Send the test email
            mailService.sendTestEmail(request.getRecipientEmail(), template, sampleOrder);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Test email sent successfully to " + request.getRecipientEmail());
            response.put("templateKey", templateResponse.getTemplateKey());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to send test email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send test email: " + e.getMessage()));
        }
    }

    /**
     * Preview email template with sample data
     * Shows how the email will look after variable replacement
     */
    @PostMapping("/{id}/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> previewTemplate(@PathVariable Long id) {
        log.info("Previewing email template: {}", id);

        try {
            EmailTemplateResponse templateResponse = emailTemplateService.getTemplateById(id);

            // Create a sample order for variable replacement
            Order sampleOrder = Order.builder()
                    .orderNumber("ORD-SAMPLE-123456")
                    .status(Order.OrderStatus.CONFIRMED)
                    .build();

            // Process template with sample data
            String processedSubject = emailTemplateService.processTemplate(templateResponse.getSubject(), sampleOrder);
            String processedBody = emailTemplateService.processTemplate(templateResponse.getBodyHtml(), sampleOrder);

            Map<String, String> preview = new HashMap<>();
            preview.put("subject", processedSubject);
            preview.put("body", processedBody);
            preview.put("templateKey", templateResponse.getTemplateKey());

            return ResponseEntity.ok(preview);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get template statistics
     */
    @GetMapping("/stats/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getTemplateSummary() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTemplates", emailTemplateService.getAllTemplates(Pageable.unpaged()).getTotalElements());
        stats.put("activeTemplates", emailTemplateService.getActiveTemplates(Pageable.unpaged()).getTotalElements());
        stats.put("availableVariables", emailTemplateService.getAvailableVariables().size());

        return ResponseEntity.ok(stats);
    }
}
