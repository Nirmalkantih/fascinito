package com.fascinito.pos.service;

import com.fascinito.pos.dto.email.EmailTemplateResponse;
import com.fascinito.pos.dto.email.EmailTemplateUpdateRequest;
import com.fascinito.pos.entity.EmailTemplate;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateService {
    private final EmailTemplateRepository emailTemplateRepository;

    /**
     * Get all email templates with pagination
     */
    @Transactional(readOnly = true)
    public Page<EmailTemplateResponse> getAllTemplates(Pageable pageable) {
        return emailTemplateRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get active email templates
     */
    @Transactional(readOnly = true)
    public Page<EmailTemplateResponse> getActiveTemplates(Pageable pageable) {
        return emailTemplateRepository.findByIsActiveTrue(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get template by ID
     */
    @Transactional(readOnly = true)
    public EmailTemplateResponse getTemplateById(Long id) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email template not found"));
        return mapToResponse(template);
    }

    /**
     * Get template by template key (used at runtime)
     */
    @Transactional(readOnly = true)
    public EmailTemplate getTemplateByKey(String templateKey) {
        return emailTemplateRepository.findByTemplateKey(templateKey)
                .orElse(null);
    }

    /**
     * Update email template
     */
    @Transactional
    public EmailTemplateResponse updateTemplate(Long id, EmailTemplateUpdateRequest request) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email template not found"));

        if (request.getSubject() != null) {
            template.setSubject(request.getSubject());
        }
        if (request.getBodyHtml() != null) {
            template.setBodyHtml(request.getBodyHtml());
        }
        if (request.getIsActive() != null) {
            template.setIsActive(request.getIsActive());
        }

        EmailTemplate updated = emailTemplateRepository.save(template);
        log.info("Updated email template: {}", template.getTemplateKey());

        return mapToResponse(updated);
    }

    /**
     * Process template with variable replacement for an order
     * Replaces placeholders like {{customerName}}, {{orderId}}, etc. with actual values
     */
    public String processTemplate(String template, Order order) {
        Map<String, String> variables = buildVariables(order);
        String result = template;

        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }

        return result;
    }

    /**
     * Build variables map from order for template processing
     */
    private Map<String, String> buildVariables(Order order) {
        Map<String, String> variables = new HashMap<>();

        // Customer information
        variables.put("customerName", order.getUser().getFirstName() + " " + order.getUser().getLastName());
        variables.put("customerEmail", order.getUser().getEmail());
        variables.put("customerPhone", order.getUser().getPhone() != null ? order.getUser().getPhone() : "N/A");

        // Order information
        variables.put("orderId", order.getOrderNumber());
        variables.put("orderDate", order.getCreatedAt().toString());
        variables.put("orderStatus", order.getStatus().toString());

        // Amount information
        variables.put("subtotal", order.getSubtotal().toString());
        variables.put("taxAmount", order.getTaxAmount().toString());
        variables.put("shippingCost", order.getShippingCost().toString());
        variables.put("discount", order.getDiscount().toString());
        variables.put("totalAmount", order.getTotalAmount().toString());

        // Address information
        variables.put("shippingAddress", order.getShippingAddress() != null ? order.getShippingAddress() : "N/A");
        variables.put("billingAddress", order.getBillingAddress() != null ? order.getBillingAddress() : "N/A");

        // Company information (can be configured)
        variables.put("companyName", "Fascinito");
        variables.put("supportEmail", "support@fascinito.com");

        // Additional info
        variables.put("invoiceNumber", order.getOrderNumber());
        variables.put("trackingId", order.getOrderNumber());
        variables.put("notes", order.getNotes() != null ? order.getNotes() : "N/A");

        return variables;
    }

    /**
     * Get available variables for templates
     */
    public List<Map<String, String>> getAvailableVariables() {
        return List.of(
                Map.of("name", "customerName", "description", "Customer's Full Name"),
                Map.of("name", "customerEmail", "description", "Customer's Email Address"),
                Map.of("name", "customerPhone", "description", "Customer's Phone Number"),
                Map.of("name", "orderId", "description", "Order ID/Number"),
                Map.of("name", "orderDate", "description", "Order Creation Date"),
                Map.of("name", "orderStatus", "description", "Current Order Status"),
                Map.of("name", "subtotal", "description", "Order Subtotal"),
                Map.of("name", "taxAmount", "description", "Tax Amount"),
                Map.of("name", "shippingCost", "description", "Shipping Cost"),
                Map.of("name", "discount", "description", "Discount Amount"),
                Map.of("name", "totalAmount", "description", "Total Order Amount"),
                Map.of("name", "shippingAddress", "description", "Shipping Address"),
                Map.of("name", "billingAddress", "description", "Billing Address"),
                Map.of("name", "companyName", "description", "Company Name"),
                Map.of("name", "supportEmail", "description", "Support Email Address"),
                Map.of("name", "invoiceNumber", "description", "Invoice Number"),
                Map.of("name", "trackingId", "description", "Tracking ID"),
                Map.of("name", "notes", "description", "Order Notes")
        );
    }

    /**
     * Map EmailTemplate to EmailTemplateResponse
     */
    private EmailTemplateResponse mapToResponse(EmailTemplate template) {
        return EmailTemplateResponse.builder()
                .id(template.getId())
                .templateKey(template.getTemplateKey())
                .templateName(template.getTemplateName())
                .subject(template.getSubject())
                .bodyHtml(template.getBodyHtml())
                .isActive(template.getIsActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
