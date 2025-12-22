package com.fascinito.pos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_type", nullable = false)
    private EmailType emailType;

    @Column(name = "recipient", nullable = false)
    private String recipient;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "success", nullable = false)
    private Boolean success;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "invoice_id")
    private Long invoiceId;

    @Column(name = "retry_count")
    private Integer retryCount;

    @Column(name = "last_retry_at")
    private LocalDateTime lastRetryAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum EmailType {
        INVOICE, ORDER_CONFIRMATION, STATUS_UPDATE, PAYMENT_SUCCESS, REFUND_NOTIFICATION
    }
}
