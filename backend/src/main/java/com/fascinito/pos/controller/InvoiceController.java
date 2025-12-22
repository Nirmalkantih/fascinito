package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.invoice.InvoiceResponse;
import com.fascinito.pos.service.InvoiceService;
import com.fascinito.pos.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final EmailService emailService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceByOrderId(@PathVariable Long orderId) {
        InvoiceResponse invoice = invoiceService.getInvoiceByOrderId(orderId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Invoice retrieved", invoice));
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable Long invoiceId) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(invoiceId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Invoice retrieved", invoice));
    }

    @GetMapping("/my-invoices")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PageResponse<InvoiceResponse>> getMyInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long userId = 1L; // In real implementation, get from security context
        Pageable pageable = PageRequest.of(page, size);
        Page<InvoiceResponse> invoices = invoiceService.getInvoicesByUserId(userId, pageable);

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

    @PostMapping("/generate/{orderId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateInvoice(
            @PathVariable Long orderId,
            @RequestParam(required = false) Long templateId
    ) {
        InvoiceResponse invoice = invoiceService.generateInvoice(orderId, templateId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Invoice generated successfully", invoice));
    }

    @PostMapping("/{invoiceId}/regenerate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> regenerateInvoice(@PathVariable Long invoiceId) {
        InvoiceResponse invoice = invoiceService.regenerateInvoice(invoiceId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Invoice regenerated successfully", invoice));
    }

    @PostMapping("/{invoiceId}/resend-email")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<String>> resendInvoiceEmail(@PathVariable Long invoiceId) {
        emailService.sendInvoiceEmail(invoiceId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Invoice email sent successfully", "Email is being sent"));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<PageResponse<InvoiceResponse>> getAllInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InvoiceResponse> invoices = invoiceService.getAllInvoices(pageable);

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

    @GetMapping("/admin/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<PageResponse<InvoiceResponse>> searchInvoices(
            @RequestParam String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InvoiceResponse> invoices = invoiceService.searchInvoices(search, pageable);

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
}
