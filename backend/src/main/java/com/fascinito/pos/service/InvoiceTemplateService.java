package com.fascinito.pos.service;

import com.fascinito.pos.dto.invoice.InvoiceTemplateRequest;
import com.fascinito.pos.dto.invoice.InvoiceTemplateResponse;
import com.fascinito.pos.entity.InvoiceTemplate;
import com.fascinito.pos.exception.BadRequestException;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.InvoiceTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceTemplateService {

    private final InvoiceTemplateRepository templateRepository;

    @Transactional(readOnly = true)
    public Page<InvoiceTemplateResponse> getAllTemplates(Pageable pageable, String search) {
        if (search != null && !search.isEmpty()) {
            return templateRepository.search(search, pageable)
                    .map(this::mapToResponse);
        }
        return templateRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public InvoiceTemplateResponse getTemplateById(Long id) {
        InvoiceTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with id: " + id));
        return mapToResponse(template);
    }

    @Transactional(readOnly = true)
    public InvoiceTemplateResponse getTemplateByTemplateId(String templateId) {
        InvoiceTemplate template = templateRepository.findByTemplateId(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with templateId: " + templateId));
        return mapToResponse(template);
    }

    @Transactional(readOnly = true)
    public InvoiceTemplateResponse getActiveTemplateByType(InvoiceTemplate.TemplateType templateType) {
        InvoiceTemplate template = templateRepository.findActiveByType(templateType)
                .orElse(null);
        return template != null ? mapToResponse(template) : null;
    }

    @Transactional(readOnly = true)
    public List<InvoiceTemplateResponse> getAllActiveTemplates() {
        return templateRepository.findAllActive()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public InvoiceTemplateResponse createTemplate(InvoiceTemplateRequest request, String createdBy) {
        // Validate that templateId is unique
        if (templateRepository.existsByTemplateId(request.getTemplateId())) {
            throw new BadRequestException("Template with templateId '" + request.getTemplateId() + "' already exists");
        }

        InvoiceTemplate template = InvoiceTemplate.builder()
                .templateId(request.getTemplateId())
                .name(request.getName())
                .description(request.getDescription())
                .templateType(request.getTemplateType())
                .subject(request.getSubject())
                .headerColor(request.getHeaderColor() != null ? request.getHeaderColor() : "#667eea")
                .footerNote(request.getFooterNote())
                .logoUrl(request.getLogoUrl())
                .bannerUrl(request.getBannerUrl())
                .showFestivalBanner(request.getShowFestivalBanner() != null ? request.getShowFestivalBanner() : false)
                .active(request.getActive() != null ? request.getActive() : true)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .build();

        template = templateRepository.save(template);
        log.info("Invoice template created: {} (templateId: {})", template.getId(), template.getTemplateId());
        return mapToResponse(template);
    }

    @Transactional
    public InvoiceTemplateResponse updateTemplate(Long id, InvoiceTemplateRequest request, String updatedBy) {
        InvoiceTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with id: " + id));

        // Check if templateId is being changed and if it's already in use
        if (!template.getTemplateId().equals(request.getTemplateId()) &&
                templateRepository.existsByTemplateId(request.getTemplateId())) {
            throw new BadRequestException("Template with templateId '" + request.getTemplateId() + "' already exists");
        }

        template.setTemplateId(request.getTemplateId());
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setTemplateType(request.getTemplateType());
        template.setSubject(request.getSubject());
        template.setHeaderColor(request.getHeaderColor() != null ? request.getHeaderColor() : template.getHeaderColor());
        template.setFooterNote(request.getFooterNote());
        template.setLogoUrl(request.getLogoUrl());
        template.setBannerUrl(request.getBannerUrl());
        template.setShowFestivalBanner(request.getShowFestivalBanner() != null ? request.getShowFestivalBanner() : template.getShowFestivalBanner());
        template.setActive(request.getActive() != null ? request.getActive() : template.getActive());
        template.setUpdatedBy(updatedBy);
        template.setUpdatedAt(LocalDateTime.now());

        template = templateRepository.save(template);
        log.info("Invoice template updated: {} (templateId: {})", template.getId(), template.getTemplateId());
        return mapToResponse(template);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        InvoiceTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with id: " + id));

        templateRepository.delete(template);
        log.info("Invoice template deleted: {} (templateId: {})", template.getId(), template.getTemplateId());
    }

    @Transactional
    public InvoiceTemplateResponse toggleActive(Long id) {
        InvoiceTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with id: " + id));

        template.setActive(!template.getActive());
        template = templateRepository.save(template);
        log.info("Invoice template status toggled: {} (active: {})", template.getId(), template.getActive());
        return mapToResponse(template);
    }

    private InvoiceTemplateResponse mapToResponse(InvoiceTemplate template) {
        return InvoiceTemplateResponse.builder()
                .id(template.getId())
                .templateId(template.getTemplateId())
                .name(template.getName())
                .description(template.getDescription())
                .templateType(template.getTemplateType())
                .subject(template.getSubject())
                .headerColor(template.getHeaderColor())
                .footerNote(template.getFooterNote())
                .logoUrl(template.getLogoUrl())
                .bannerUrl(template.getBannerUrl())
                .showFestivalBanner(template.getShowFestivalBanner())
                .active(template.getActive())
                .createdBy(template.getCreatedBy())
                .updatedBy(template.getUpdatedBy())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
