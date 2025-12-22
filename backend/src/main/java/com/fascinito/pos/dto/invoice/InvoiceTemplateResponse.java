package com.fascinito.pos.dto.invoice;

import com.fascinito.pos.entity.InvoiceTemplate;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InvoiceTemplateResponse {

    private Long id;
    private String templateId;
    private String name;
    private String description;
    private InvoiceTemplate.TemplateType templateType;
    private String subject;
    private String headerColor;
    private String footerNote;
    private String logoUrl;
    private String bannerUrl;
    private Boolean showFestivalBanner;
    private Boolean active;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
