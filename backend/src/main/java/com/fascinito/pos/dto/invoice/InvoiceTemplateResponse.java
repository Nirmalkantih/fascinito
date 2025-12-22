package com.fascinito.pos.dto.invoice;

import com.fascinito.pos.entity.InvoiceTemplate;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
