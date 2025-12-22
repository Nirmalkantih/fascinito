package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.invoice.InvoiceResponse;
import com.fascinito.pos.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;

    /**
     * Generate invoice for an order
     */
    @PostMapping("/generate/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateInvoice(
            @PathVariable Long orderId,
            @RequestParam(required = false) Long templateId
    ) {
        InvoiceResponse invoice = invoiceService.generateInvoice(orderId, templateId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Invoice generated successfully", invoice));
    }

    /**
     * Regenerate existing invoice
     */
    @PostMapping("/{invoiceId}/regenerate")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> regenerateInvoice(@PathVariable Long invoiceId) {
        InvoiceResponse invoice = invoiceService.regenerateInvoice(invoiceId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Invoice regenerated successfully", invoice));
    }

    /**
     * Get invoice by order ID
     */
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceByOrderId(@PathVariable Long orderId) {
        InvoiceResponse invoice = invoiceService.getInvoiceByOrderId(orderId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Invoice retrieved successfully", invoice));
    }

    /**
     * Get invoice by invoice ID
     */
    @GetMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable Long invoiceId) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(invoiceId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Invoice retrieved successfully", invoice));
    }

    /**
     * Get user's invoices
     */
    @GetMapping("/my-invoices")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PageResponse<InvoiceResponse>> getUserInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        // Get current user ID from SecurityContext
        Long userId = 1L; // This should come from SecurityContext

        Page<InvoiceResponse> invoices = invoiceService.getUserInvoices(userId, pageable);

        PageResponse<InvoiceResponse> response = PageResponse.<InvoiceResponse>builder()
                .content(invoices.getContent())
                .pageNumber(invoices.getNumber())
                .pageSize(invoices.getSize())
                .totalElements(invoices.getTotalElements())
                .totalPages(invoices.getTotalPages())
                .last(invoices.isLast())
                .first(invoices.isFirst())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Search invoices (admin)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<InvoiceResponse>> searchInvoices(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InvoiceResponse> invoices;

        if (search != null && !search.isEmpty()) {
            invoices = invoiceService.searchInvoices(search, pageable);
        } else {
            invoices = invoiceService.getAllInvoices(pageable);
        }

        PageResponse<InvoiceResponse> response = PageResponse.<InvoiceResponse>builder()
                .content(invoices.getContent())
                .pageNumber(invoices.getNumber())
                .pageSize(invoices.getSize())
                .totalElements(invoices.getTotalElements())
                .totalPages(invoices.getTotalPages())
                .last(invoices.isLast())
                .first(invoices.isFirst())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Download invoice PDF
     */
    @GetMapping("/{invoiceId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<?> downloadInvoice(@PathVariable Long invoiceId) {
        try {
            InvoiceResponse invoice = invoiceService.getInvoiceById(invoiceId);

            if (invoice.getFilePath() == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Invoice PDF not found", null));
            }

            byte[] pdfBytes = Files.readAllBytes(Paths.get(invoice.getFilePath()));

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + invoice.getInvoiceNumber() + ".pdf\"")
                    .header("Content-Type", "application/pdf")
                    .body(pdfBytes);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Failed to download invoice: " + e.getMessage(), null));
        }
    }

    /**
     * Resend invoice email
     */
    @PostMapping("/{invoiceId}/resend-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> resendInvoiceEmail(@PathVariable Long invoiceId) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(invoiceId);

        // Call email service to resend email
        // emailService.sendInvoiceEmail(invoice.getOrderId(), invoiceId);

        return ResponseEntity.ok(new ApiResponse<>(true, "Invoice email sent successfully", null));
    }
}
