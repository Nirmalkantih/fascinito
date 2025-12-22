package com.fascinito.pos.dto.invoice;

import com.fascinito.pos.entity.InvoiceTemplate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceTemplateRequest {

    @NotBlank(message = "Template ID is required")
    private String templateId;

    @NotBlank(message = "Template name is required")
    private String name;

    private String description;

    @NotNull(message = "Template type is required")
    private InvoiceTemplate.TemplateType templateType;

    @NotBlank(message = "Email subject is required")
    private String subject;

    private String headerColor;

    private String footerNote;

    private String logoUrl;

    private String bannerUrl;

    private Boolean showFestivalBanner;

    private Boolean active;
}
