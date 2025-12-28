package com.fascinito.pos.dto.email;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmailTemplateRequest {
    @NotBlank(message = "Template key is required")
    private String templateKey;

    @NotBlank(message = "Template name is required")
    private String templateName;

    @NotBlank(message = "Email subject is required")
    private String subject;

    @NotBlank(message = "Email body is required")
    private String bodyHtml;

    @NotNull(message = "Active status is required")
    private Boolean isActive;
}
