package com.fascinito.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignResponse {

    private Long id;
    private String campaignName;
    private Long templateId;
    private String templateName;
    private String subject;
    private String targetType;
    private String status;
    private LocalDateTime scheduledAt;
    private Integer totalRecipients;
    private Integer sentCount;
    private Integer failedCount;
    private Integer pendingCount;
    private Double successRate;
    private String createdByName;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
