package com.fascinito.pos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String templateKey;

    @Column(nullable = false, length = 100)
    private String templateName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String bodyHtml;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum TemplateKey {
        ORDER_CONFIRMED("ORDER_CONFIRMED", "Order Confirmation"),
        ORDER_PROCESSING("ORDER_PROCESSING", "Order Processing"),
        ORDER_SHIPPED("ORDER_SHIPPED", "Order Shipped"),
        ORDER_DELIVERED("ORDER_DELIVERED", "Order Delivered"),
        ORDER_CANCELLED("ORDER_CANCELLED", "Order Cancelled"),
        RETURN_REQUESTED("RETURN_REQUESTED", "Return Requested"),
        REFUND_INITIATED("REFUND_INITIATED", "Refund Initiated"),
        REFUND_COMPLETED("REFUND_COMPLETED", "Refund Completed");

        private final String key;
        private final String displayName;

        TemplateKey(String key, String displayName) {
            this.key = key;
            this.displayName = displayName;
        }

        public String getKey() {
            return key;
        }

        public String getDisplayName() {
            return displayName;
        }

        public static TemplateKey fromOrderStatus(Order.OrderStatus status) {
            return switch (status) {
                case CONFIRMED -> ORDER_CONFIRMED;
                case PROCESSING -> ORDER_PROCESSING;
                case SHIPPED -> ORDER_SHIPPED;
                case DELIVERED -> ORDER_DELIVERED;
                case CANCELLED -> ORDER_CANCELLED;
                case RETURN_REQUEST -> RETURN_REQUESTED;
                case REFUNDED -> REFUND_COMPLETED;
                default -> null;
            };
        }
    }
}
