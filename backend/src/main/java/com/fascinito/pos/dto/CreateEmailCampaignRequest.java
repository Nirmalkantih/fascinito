package com.fascinito.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmailCampaignRequest {

    @NotBlank(message = "Campaign name is required")
    @Size(min = 3, max = 255, message = "Campaign name must be between 3 and 255 characters")
    private String campaignName;

    @NotNull(message = "Template ID is required")
    private Long templateId;

    @NotBlank(message = "Subject is required")
    @Size(max = 500, message = "Subject must not exceed 500 characters")
    private String subject;

    @NotBlank(message = "Email body is required")
    private String body;

    @NotNull(message = "Target type is required")
    private String targetType; // ALL, SELECTED, SEGMENT

    @FutureOrPresent(message = "Scheduled date must be in the present or future")
    private LocalDateTime scheduledAt; // Optional, only for SCHEDULED campaigns

    @NotNull(message = "Recipient list is required")
    @NotEmpty(message = "At least one recipient must be selected")
    private List<Long> recipientIds; // List of user IDs to receive the email

    @Email(message = "Test email address must be valid")
    private String testEmail; // Optional, to send test before scheduling

    @Builder.Default
    private Boolean sendImmediately = false; // If true, send immediately instead of scheduling
}
