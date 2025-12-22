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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceTemplateService {

    private final InvoiceTemplateRepository templateRepository;

    @Transactional(readOnly = true)
    public List<InvoiceTemplateResponse> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<InvoiceTemplateResponse> getAllTemplatesPaginated(Pageable pageable) {
        return templateRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<InvoiceTemplateResponse> getActiveTemplates() {
        return templateRepository.findAllActive().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceTemplateResponse getTemplateById(Long id) {
        InvoiceTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with id: " + id));
        return mapToResponse(template);
    }

    @Transactional(readOnly = true)
    public InvoiceTemplateResponse getActiveTemplateByType(InvoiceTemplate.TemplateType type) {
        InvoiceTemplate template = templateRepository.findActiveByType(type)
                .orElseThrow(() -> new ResourceNotFoundException("No active invoice template found for type: " + type));
        return mapToResponse(template);
    }

    @Transactional
    public InvoiceTemplateResponse createTemplate(InvoiceTemplateRequest request, String createdBy) {
        // Check if templateId is unique
        if (templateRepository.existsByTemplateId(request.getTemplateId())) {
            throw new BadRequestException("Template ID '" + request.getTemplateId() + "' already exists");
        }

        InvoiceTemplate template = InvoiceTemplate.builder()
                .templateId(request.getTemplateId())
                .name(request.getName())
                .description(request.getDescription())
                .templateType(request.getTemplateType())
                .subject(request.getSubject())
                .headerColor(request.getHeaderColor())
                .footerNote(request.getFooterNote())
                .logoUrl(request.getLogoUrl())
                .bannerUrl(request.getBannerUrl())
                .showFestivalBanner(request.getShowFestivalBanner() != null ? request.getShowFestivalBanner() : false)
                .active(request.getActive() != null ? request.getActive() : true)
                .createdBy(createdBy)
                .build();

        template = templateRepository.save(template);
        log.info("Invoice template created: {} (ID: {})", request.getTemplateId(), template.getId());
        return mapToResponse(template);
    }

    @Transactional
    public InvoiceTemplateResponse updateTemplate(Long id, InvoiceTemplateRequest request, String updatedBy) {
        InvoiceTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with id: " + id));

        // Check templateId uniqueness if changed
        if (!template.getTemplateId().equals(request.getTemplateId()) && 
            templateRepository.existsByTemplateId(request.getTemplateId())) {
            throw new BadRequestException("Template ID '" + request.getTemplateId() + "' already exists");
        }

        template.setTemplateId(request.getTemplateId());
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setTemplateType(request.getTemplateType());
        template.setSubject(request.getSubject());
        template.setHeaderColor(request.getHeaderColor());
        template.setFooterNote(request.getFooterNote());
        template.setLogoUrl(request.getLogoUrl());
        template.setBannerUrl(request.getBannerUrl());
        template.setShowFestivalBanner(request.getShowFestivalBanner());
        template.setActive(request.getActive());
        template.setUpdatedBy(updatedBy);

        template = templateRepository.save(template);
        log.info("Invoice template updated: {} (ID: {})", request.getTemplateId(), template.getId());
        return mapToResponse(template);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        InvoiceTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice template not found with id: " + id));

        templateRepository.delete(template);
        log.info("Invoice template deleted: {} (ID: {})", template.getTemplateId(), id);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceTemplateResponse> searchTemplates(String search, Pageable pageable) {
        return templateRepository.search(search, pageable)
                .map(this::mapToResponse);
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
