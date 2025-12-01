package com.fascinito.pos.dto.order;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {
    private String shippingAddress;
    private String billingAddress;
    private String notes;
    private BigDecimal discount;
    private String paymentMethod;  // CREDIT_CARD, DEBIT_CARD, PAYPAL, CASH, etc.
    private Boolean testMode;  // If true, allows checkout with empty cart for demo purposes
}
