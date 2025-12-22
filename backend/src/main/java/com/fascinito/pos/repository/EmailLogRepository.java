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

    @Query("SELECT l FROM EmailLog l WHERE l.success = false ORDER BY l.createdAt ASC")
    List<EmailLog> findFailedEmails();

    @Query("SELECT l FROM EmailLog l WHERE l.orderId = :orderId ORDER BY l.createdAt DESC")
    List<EmailLog> findByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT l FROM EmailLog l WHERE l.invoiceId = :invoiceId ORDER BY l.createdAt DESC")
    List<EmailLog> findByInvoiceId(@Param("invoiceId") Long invoiceId);

    @Query("SELECT l FROM EmailLog l WHERE l.emailType = :emailType ORDER BY l.createdAt DESC")
    Page<EmailLog> findByEmailType(@Param("emailType") EmailLog.EmailType emailType, Pageable pageable);

    @Query("SELECT l FROM EmailLog l WHERE l.success = true AND l.createdAt >= :since ORDER BY l.createdAt DESC")
    List<EmailLog> findSuccessfulEmailsSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(l) FROM EmailLog l WHERE l.success = true AND l.createdAt >= :startDate AND l.createdAt <= :endDate")
    long countSuccessfulEmailsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(l) FROM EmailLog l WHERE l.success = false AND l.createdAt >= :startDate AND l.createdAt <= :endDate")
    long countFailedEmailsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
