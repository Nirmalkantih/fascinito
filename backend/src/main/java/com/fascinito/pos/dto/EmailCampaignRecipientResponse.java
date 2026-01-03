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
public class EmailCampaignRecipientResponse {

    private Long id;
    private Long campaignId;
    private Long customerId;
    private String customerName;
    private String email;
    private String status;
    private LocalDateTime sentAt;
    private String errorMessage;
    private LocalDateTime createdAt;
}
