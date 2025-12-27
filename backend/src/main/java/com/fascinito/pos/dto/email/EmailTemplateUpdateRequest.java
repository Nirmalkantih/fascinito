package com.fascinito.pos.dto.email;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplateUpdateRequest {
    private String subject;
    private String bodyHtml;
    private Boolean isActive;
}
