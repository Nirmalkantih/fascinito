package com.fascinito.pos.dto.order;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private String transactionId;
    private String paymentMethod;  // CREDIT_CARD, DEBIT_CARD, PAYPAL, STRIPE, CASH, OTHER
    private String status;  // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED
    private BigDecimal amount;
    private String currency;
    private String paymentDetails;
    private String failureReason;
    private Long createdAtTimestamp;
}
