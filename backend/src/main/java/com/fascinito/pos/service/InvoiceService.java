package com.fascinito.pos.service;

import com.fascinito.pos.dto.invoice.InvoiceResponse;
import com.fascinito.pos.entity.*;
import com.fascinito.pos.exception.BadRequestException;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.InvoiceRepository;
import com.fascinito.pos.repository.InvoiceTemplateRepository;
import com.fascinito.pos.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final OrderRepository orderRepository;
    private final SpringTemplateEngine templateEngine;

    @Value("${app.invoice.upload-path:uploads/invoices}")
    private String invoiceUploadPath;

    @Value("${app.invoice.base-url:http://localhost:8080}")
    private String invoiceBaseUrl;

    private static final DateTimeFormatter INVOICE_NUMBER_FORMATTER = DateTimeFormatter.ofPattern("yyyy");

    @Transactional
    public InvoiceResponse generateInvoice(Long orderId, Long templateId) {
        // Fetch order with all necessary data
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Check if invoice already exists
        if (invoiceRepository.existsByOrderId(orderId)) {
            throw new BadRequestException("Invoice already exists for order: " + orderId);
        }

        // Fetch template (use provided templateId or get default active template)
        InvoiceTemplate template;
        if (templateId != null) {
            template = invoiceTemplateRepository.findById(templateId)
                    .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with id: " + templateId));
        } else {
            // Use default REGULAR template if no template specified
            template = invoiceTemplateRepository.findActiveByType(InvoiceTemplate.TemplateType.REGULAR)
                    .orElseThrow(() -> new ResourceNotFoundException("No active invoice template found"));
        }

        try {
            // Generate invoice number (INV-YYYY-00001)
            String invoiceNumber = generateInvoiceNumber();

            // Create invoice entity first
            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invoiceNumber)
                    .order(order)
                    .user(order.getUser())
                    .invoiceTemplate(template)
                    .emailSent(false)
                    .regeneratedCount(0)
                    .generatedAt(LocalDateTime.now())
                    .build();

            // Prepare data for template
            Context context = prepareInvoiceContext(order, template, invoice);

            // Render HTML from template
            String html = templateEngine.process("invoice-template", context);

            // Generate PDF
            String pdfPath = generatePDF(html, invoiceNumber);

            // Update invoice with file paths
            invoice.setFilePath(pdfPath);
            invoice.setFileUrl(invoiceBaseUrl + "/invoices/" + new File(pdfPath).getName());

            // Save invoice
            invoice = invoiceRepository.save(invoice);

            log.info("Invoice generated successfully: {} (Order ID: {})", invoiceNumber, orderId);
            return mapToResponse(invoice, order);

        } catch (IOException e) {
            log.error("Error generating invoice PDF for order: {}", orderId, e);
            throw new BadRequestException("Failed to generate invoice PDF: " + e.getMessage());
        }
    }

    @Transactional
    public InvoiceResponse regenerateInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        Order order = invoice.getOrder();
        InvoiceTemplate template = invoice.getInvoiceTemplate();

        try {
            // Delete old PDF file if exists
            if (invoice.getFilePath() != null) {
                try {
                    Files.deleteIfExists(Paths.get(invoice.getFilePath()));
                } catch (IOException e) {
                    log.warn("Could not delete old invoice file: {}", invoice.getFilePath(), e);
                }
            }

            // Prepare data for template
            Context context = prepareInvoiceContext(order, template, invoice);

            // Render HTML
            String html = templateEngine.process("invoice-template", context);

            // Generate new PDF
            String pdfPath = generatePDF(html, invoice.getInvoiceNumber());

            // Update invoice
            invoice.setFilePath(pdfPath);
            invoice.setFileUrl(invoiceBaseUrl + "/invoices/" + new File(pdfPath).getName());
            invoice.setRegeneratedCount((invoice.getRegeneratedCount() != null ? invoice.getRegeneratedCount() : 0) + 1);
            invoice.setUpdatedAt(LocalDateTime.now());

            invoice = invoiceRepository.save(invoice);

            log.info("Invoice regenerated successfully: {} (Invoice ID: {})", invoice.getInvoiceNumber(), invoiceId);
            return mapToResponse(invoice, order);

        } catch (IOException e) {
            log.error("Error regenerating invoice PDF: {}", invoiceId, e);
            throw new BadRequestException("Failed to regenerate invoice PDF: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByOrderId(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for order id: " + orderId));

        Order order = invoice.getOrder();
        return mapToResponse(invoice, order);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        Order order = invoice.getOrder();
        return mapToResponse(invoice, order);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getUserInvoices(Long userId, Pageable pageable) {
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
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        invoice.setEmailSent(true);
        invoice.setEmailSentAt(LocalDateTime.now());
        invoiceRepository.save(invoice);
        log.info("Invoice marked as email sent: {}", invoiceId);
    }

    private String generateInvoiceNumber() {
        // Generate invoice number format: INV-YYYY-00001
        String year = LocalDateTime.now().format(INVOICE_NUMBER_FORMATTER);
        // In a real scenario, this should be generated with a sequence counter
        String sequenceNumber = String.format("%05d", (System.currentTimeMillis() % 100000));
        return "INV-" + year + "-" + sequenceNumber;
    }

    private Context prepareInvoiceContext(Order order, InvoiceTemplate template, Invoice invoice) {
        Context context = new Context();
        context.setVariable("invoice", invoice);
        context.setVariable("order", order);
        context.setVariable("customer", order.getUser());
        context.setVariable("items", order.getItems());
        context.setVariable("payment", order.getPayment());
        context.setVariable("template", template);
        context.setVariable("createdDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss")));
        return context;
    }

    private String generatePDF(String html, String invoiceNumber) throws IOException {
        // Ensure upload directory exists
        Path uploadDir = Paths.get(invoiceUploadPath);
        Files.createDirectories(uploadDir);

        // Generate unique filename
        String filename = invoiceNumber + "_" + UUID.randomUUID() + ".pdf";
        Path filePath = uploadDir.resolve(filename);

        // Generate PDF using Flying Saucer
        try (OutputStream os = new FileOutputStream(filePath.toFile())) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html, invoiceBaseUrl);
            renderer.layout();
            renderer.createPDF(os);
            log.info("PDF generated successfully: {}", filePath);
        } catch (Exception e) {
            log.error("Error generating PDF: {}", filename, e);
            throw new IOException("Failed to generate PDF: " + e.getMessage(), e);
        }

        return filePath.toString();
    }

    private InvoiceResponse mapToResponse(Invoice invoice, Order order) {
        User customer = order.getUser();
        InvoiceTemplate template = invoice.getInvoiceTemplate();

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(customer.getId())
                .customerName(customer.getFirstName() + " " + customer.getLastName())
                .customerEmail(customer.getEmail())
                .invoiceTemplateId(template != null ? template.getId() : null)
                .templateName(template != null ? template.getName() : null)
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
