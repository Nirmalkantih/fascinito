package com.fascinito.pos.dto.order;

import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String userEmail;
    private String userFirstName;
    private String userLastName;
    private String status;  // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal shippingCost;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String billingAddress;
    private String notes;
    private List<OrderItemResponse> items = new ArrayList<>();
    private PaymentResponse payment;
    private List<OrderStatusHistoryResponse> statusHistory = new ArrayList<>();
    private Long createdAtTimestamp;
    private Long updatedAtTimestamp;
}
