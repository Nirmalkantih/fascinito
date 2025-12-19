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
public class RefundResponse {
    private Long id;
    private Long orderId;
    private String refundType;
    private BigDecimal refundAmount;
    private String razorpayRefundId;
    private String refundStatus;
    private String failureReason;
    private Long createdAtTimestamp;
    private Long updatedAtTimestamp;
}
