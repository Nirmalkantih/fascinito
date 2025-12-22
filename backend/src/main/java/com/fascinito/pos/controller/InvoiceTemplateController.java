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

    @GetMapping
    public ResponseEntity<PageResponse<InvoiceTemplateResponse>> getAllTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InvoiceTemplateResponse> templates = invoiceTemplateService.getAllTemplatesPaginated(pageable);

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

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<InvoiceTemplateResponse>>> getActiveTemplates() {
        List<InvoiceTemplateResponse> templates = invoiceTemplateService.getActiveTemplates();
        return ResponseEntity.ok(ApiResponse.success("Active templates retrieved", templates));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> getTemplateById(@PathVariable Long id) {
        InvoiceTemplateResponse template = invoiceTemplateService.getTemplateById(id);
        return ResponseEntity.ok(ApiResponse.success("Template retrieved", template));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> createTemplate(
            @Valid @RequestBody InvoiceTemplateRequest request
    ) {
        String createdBy = "SYSTEM"; // In real implementation, get from security context
        InvoiceTemplateResponse template = invoiceTemplateService.createTemplate(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Template created successfully", template));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceTemplateRequest request
    ) {
        String updatedBy = "SYSTEM"; // In real implementation, get from security context
        InvoiceTemplateResponse template = invoiceTemplateService.updateTemplate(id, request, updatedBy);
        return ResponseEntity.ok(ApiResponse.success("Template updated successfully", template));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        invoiceTemplateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success("Template deleted successfully", null));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<InvoiceTemplateResponse>> searchTemplates(
            @RequestParam String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InvoiceTemplateResponse> templates = invoiceTemplateService.searchTemplates(search, pageable);

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
}
