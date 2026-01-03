package com.fascinito.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignStatsResponse {

    private Long campaignId;
    private Integer totalRecipients;
    private Integer sentCount;
    private Integer failedCount;
    private Integer pendingCount;
    private Double successRate;
    private Double failureRate;
    private String status;
}
