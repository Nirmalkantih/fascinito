package com.fascinito.pos.dto.order;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusHistoryResponse {
    private Long id;
    private String status;
    private String notes;
    private String updatedBy;
    private Long createdAtTimestamp;
}
