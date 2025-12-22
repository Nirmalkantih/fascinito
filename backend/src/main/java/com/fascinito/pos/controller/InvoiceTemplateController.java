package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.invoice.InvoiceTemplateRequest;
import com.fascinito.pos.dto.invoice.InvoiceTemplateResponse;
import com.fascinito.pos.service.InvoiceTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/invoice-templates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceTemplateController {

    private final InvoiceTemplateService invoiceTemplateService;

    /**
     * Get all invoice templates with pagination and search
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<InvoiceTemplateResponse>> getAllTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InvoiceTemplateResponse> templates = invoiceTemplateService.getAllTemplates(pageable, search);

        PageResponse<InvoiceTemplateResponse> response = PageResponse.<InvoiceTemplateResponse>builder()
                .content(templates.getContent())
                .pageNumber(templates.getNumber())
                .pageSize(templates.getSize())
                .totalElements(templates.getTotalElements())
                .totalPages(templates.getTotalPages())
                .last(templates.isLast())
                .first(templates.isFirst())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Get all active templates
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<InvoiceTemplateResponse>>> getActiveTemplates() {
        List<InvoiceTemplateResponse> templates = invoiceTemplateService.getAllActiveTemplates();
        return ResponseEntity.ok(new ApiResponse<>(true, "Active templates retrieved successfully", templates));
    }

    /**
     * Get template by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> getTemplateById(@PathVariable Long id) {
        InvoiceTemplateResponse template = invoiceTemplateService.getTemplateById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Template retrieved successfully", template));
    }

    /**
     * Get template by template ID
     */
    @GetMapping("/by-id/{templateId}")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> getTemplateByTemplateId(@PathVariable String templateId) {
        InvoiceTemplateResponse template = invoiceTemplateService.getTemplateByTemplateId(templateId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Template retrieved successfully", template));
    }

    /**
     * Create new invoice template
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> createTemplate(
            @Valid @RequestBody InvoiceTemplateRequest request
    ) {
        String createdBy = "ADMIN"; // This should come from SecurityContext
        InvoiceTemplateResponse template = invoiceTemplateService.createTemplate(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Template created successfully", template));
    }

    /**
     * Update invoice template
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceTemplateRequest request
    ) {
        String updatedBy = "ADMIN"; // This should come from SecurityContext
        InvoiceTemplateResponse template = invoiceTemplateService.updateTemplate(id, request, updatedBy);
        return ResponseEntity.ok(new ApiResponse<>(true, "Template updated successfully", template));
    }

    /**
     * Delete invoice template
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        invoiceTemplateService.deleteTemplate(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Template deleted successfully", null));
    }

    /**
     * Toggle template active status
     */
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> toggleActive(@PathVariable Long id) {
        InvoiceTemplateResponse template = invoiceTemplateService.toggleActive(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Template status updated successfully", template));
    }
}
