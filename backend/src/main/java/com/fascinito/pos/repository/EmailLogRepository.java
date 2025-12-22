package com.fascinito.pos.repository;

import com.fascinito.pos.entity.EmailLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {

    @Query("SELECT l FROM EmailLog l WHERE l.orderId = :orderId ORDER BY l.createdAt DESC")
    List<EmailLog> findByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT l FROM EmailLog l WHERE l.invoiceId = :invoiceId ORDER BY l.createdAt DESC")
    List<EmailLog> findByInvoiceId(@Param("invoiceId") Long invoiceId);

    @Query("SELECT l FROM EmailLog l WHERE l.success = false AND l.retryCount < 3 ORDER BY l.createdAt ASC")
    List<EmailLog> findFailedEmailsForRetry();

    @Query("SELECT COUNT(l) FROM EmailLog l WHERE l.success = true")
    long countSuccessfulEmails();

    @Query("SELECT COUNT(l) FROM EmailLog l WHERE l.success = false")
    long countFailedEmails();

    @Query("SELECT COUNT(l) FROM EmailLog l WHERE l.emailType = :emailType AND l.success = true")
    long countByTypeAndSuccess(@Param("emailType") EmailLog.EmailType emailType);

    Page<EmailLog> findBySuccess(Boolean success, Pageable pageable);

    @Query("SELECT l FROM EmailLog l WHERE l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    List<EmailLog> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
