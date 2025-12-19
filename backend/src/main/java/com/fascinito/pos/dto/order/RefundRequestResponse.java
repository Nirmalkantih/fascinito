package com.fascinito.pos.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequestResponse {

    private Long id;

    private Long orderId;

    private String status;

    private String reason;

    private String comment;

    private String requestedByEmail;

    private Long createdAtTimestamp;

    private Long updatedAtTimestamp;
}
