package com.fascinito.pos.dto.invoice;

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
public class InvoiceResponse {

    private Long id;
    private String invoiceNumber;
    private Long orderId;
    private String orderNumber;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private Long invoiceTemplateId;
    private String templateName;
    private String filePath;
    private String fileUrl;
    private Boolean emailSent;
    private LocalDateTime emailSentAt;
    private Integer regeneratedCount;
    private LocalDateTime generatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
