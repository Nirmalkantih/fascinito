package com.fascinito.pos.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderResponse {
    private String orderId;  // Razorpay order ID
    private Long orderIdDb;  // Database order ID
    private String currency;
    private Long amount;
    private String keyId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String receipt;
}
