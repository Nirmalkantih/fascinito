package com.fascinito.pos.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InitiateRefundRequest {
    private String refundType;  // FULL or PARTIAL
    private BigDecimal refundAmount;  // Required for PARTIAL, optional for FULL
}
