package com.fascinito.pos.service;

import com.fascinito.pos.config.AppConfig;
import com.fascinito.pos.dto.invoice.InvoiceResponse;
import com.fascinito.pos.entity.Invoice;
import com.fascinito.pos.entity.InvoiceTemplate;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.exception.BadRequestException;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.InvoiceRepository;
import com.fascinito.pos.repository.OrderRepository;
import com.fascinito.pos.repository.InvoiceTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final InvoiceTemplateService invoiceTemplateService;
    private final TemplateEngine templateEngine;
    private final AppConfig appConfig;

    @Transactional
    public InvoiceResponse generateInvoice(Long orderId, Long templateId) {
        // Fetch order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Check if invoice already exists
        if (invoiceRepository.existsByOrderId(orderId)) {
            throw new BadRequestException("Invoice already exists for this order");
        }

        // Fetch template or use default
        InvoiceTemplate template = null;
        if (templateId != null) {
            template = getInvoiceTemplateById(templateId);
        } else {
            // Get default active template
            try {
                template = getInvoiceTemplate(InvoiceTemplate.TemplateType.REGULAR);
            } catch (Exception e) {
                log.warn("No default template found, using system default");
            }
        }

        try {
            // Generate invoice number
            String invoiceNumber = generateInvoiceNumber();

            // Prepare context for Thymeleaf
            Context context = prepareInvoiceContext(order, template);

            // Generate HTML from Thymeleaf template
            String htmlContent = templateEngine.process("invoice-template", context);

            // Convert HTML to PDF
            byte[] pdfBytes = htmlToPdf(htmlContent);

            // Save PDF file
            String filePath = savePdfFile(pdfBytes, invoiceNumber);

            // Create Invoice entity
            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invoiceNumber)
                    .order(order)
                    .user(order.getUser())
                    .invoiceTemplate(template)
                    .filePath(filePath)
                    .fileUrl(String.format("%s/invoices/%s/download", appConfig.getInvoice().getBaseUrl(), invoiceNumber))
                    .emailSent(false)
                    .regeneratedCount(0)
                    .generatedAt(LocalDateTime.now())
                    .build();

            invoice = invoiceRepository.save(invoice);
            log.info("Invoice generated successfully: {} for order: {}", invoiceNumber, order.getOrderNumber());

            return mapToResponse(invoice, order);
        } catch (IOException e) {
            log.error("Error generating PDF for order {}", orderId, e);
            throw new RuntimeException("Failed to generate invoice PDF", e);
        }
    }

    @Transactional
    public InvoiceResponse regenerateInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        try {
            Order order = invoice.getOrder();
            InvoiceTemplate template = invoice.getInvoiceTemplate();

            // Prepare context
            Context context = prepareInvoiceContext(order, template);

            // Generate HTML
            String htmlContent = templateEngine.process("invoice-template", context);

            // Convert to PDF
            byte[] pdfBytes = htmlToPdf(htmlContent);

            // Save new PDF
            String filePath = savePdfFile(pdfBytes, invoice.getInvoiceNumber());

            // Update invoice
            invoice.setFilePath(filePath);
            invoice.setGeneratedAt(LocalDateTime.now());
            invoice.setRegeneratedCount((invoice.getRegeneratedCount() != null ? invoice.getRegeneratedCount() : 0) + 1);

            invoice = invoiceRepository.save(invoice);
            log.info("Invoice regenerated: {}", invoice.getInvoiceNumber());

            return mapToResponse(invoice, order);
        } catch (IOException e) {
            log.error("Error regenerating invoice {}", invoiceId, e);
            throw new RuntimeException("Failed to regenerate invoice", e);
        }
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByOrderId(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("No invoice found for order id: " + orderId));

        return mapToResponse(invoice, invoice.getOrder());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        return mapToResponse(invoice, invoice.getOrder());
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getInvoicesByUserId(Long userId, Pageable pageable) {
        return invoiceRepository.findByUserId(userId, pageable)
                .map(invoice -> mapToResponse(invoice, invoice.getOrder()));
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> searchInvoices(String search, Pageable pageable) {
        return invoiceRepository.search(search, pageable)
                .map(invoice -> mapToResponse(invoice, invoice.getOrder()));
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getAllInvoices(Pageable pageable) {
        return invoiceRepository.findAll(pageable)
                .map(invoice -> mapToResponse(invoice, invoice.getOrder()));
    }

    @Transactional
    public void markEmailSent(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setEmailSent(true);
        invoice.setEmailSentAt(LocalDateTime.now());
        invoiceRepository.save(invoice);
        log.debug("Invoice {} marked as email sent", invoiceId);
    }

    private String generateInvoiceNumber() {
        // Format: INV-YYYY-XXXXX
        LocalDateTime now = LocalDateTime.now();
        String year = String.valueOf(now.getYear());
        String random = String.format("%05d", (int) (Math.random() * 100000));
        return String.format("INV-%s-%s", year, random);
    }

    private Context prepareInvoiceContext(Order order, InvoiceTemplate template) {
        Context context = new Context();

        // Add order data
        context.setVariable("order", order);
        context.setVariable("customer", order.getUser());
        context.setVariable("payment", order.getPayment());
        context.setVariable("template", template);

        // Create invoice object for template
        Map<String, Object> invoice = new HashMap<>();
        invoice.put("invoiceNumber", generateInvoiceNumber());
        invoice.put("generatedAt", LocalDateTime.now());
        context.setVariable("invoice", invoice);

        return context;
    }

    private byte[] htmlToPdf(String htmlContent) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(htmlContent);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Error converting HTML to PDF", e);
            throw new IOException("Failed to convert HTML to PDF", e);
        } finally {
            outputStream.close();
        }
    }

    private String savePdfFile(byte[] pdfBytes, String invoiceNumber) throws IOException {
        // Create invoices directory if it doesn't exist
        Path uploadDir = Paths.get(appConfig.getInvoice().getUploadPath());
        Files.createDirectories(uploadDir);

        // Generate filename
        String filename = String.format("%s_%s.pdf", invoiceNumber, UUID.randomUUID().toString().substring(0, 8));
        Path filePath = uploadDir.resolve(filename);

        // Write PDF to file
        Files.write(filePath, pdfBytes);
        log.debug("PDF saved to: {}", filePath.toAbsolutePath());

        // Return relative path for storage
        return String.format("/uploads/invoices/%s", filename);
    }

    private InvoiceTemplate getInvoiceTemplate(InvoiceTemplate.TemplateType type) {
        try {
            return new InvoiceTemplate();
            // This would fetch from the repository in a real scenario
        } catch (Exception e) {
            return null;
        }
    }

    private InvoiceTemplate getInvoiceTemplateById(Long templateId) {
        return invoiceTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found with id: " + templateId));
    }

    private InvoiceResponse mapToResponse(Invoice invoice, Order order) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .customerName(order.getUser().getFirstName() + " " + order.getUser().getLastName())
                .customerEmail(order.getUser().getEmail())
                .invoiceTemplateId(invoice.getInvoiceTemplate() != null ? invoice.getInvoiceTemplate().getId() : null)
                .templateName(invoice.getInvoiceTemplate() != null ? invoice.getInvoiceTemplate().getName() : null)
                .filePath(invoice.getFilePath())
                .fileUrl(invoice.getFileUrl())
                .emailSent(invoice.getEmailSent())
                .emailSentAt(invoice.getEmailSentAt())
                .regeneratedCount(invoice.getRegeneratedCount())
                .generatedAt(invoice.getGeneratedAt())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
