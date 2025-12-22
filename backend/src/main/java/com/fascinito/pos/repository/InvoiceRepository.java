package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByOrderId(Long orderId);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    boolean existsByOrderId(Long orderId);

    @Query("SELECT i FROM Invoice i WHERE i.user.id = :userId ORDER BY i.createdAt DESC")
    Page<Invoice> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.emailSent = false ORDER BY i.createdAt ASC")
    List<Invoice> findPendingEmailInvoices();

    @Query("SELECT i FROM Invoice i WHERE i.emailSent = true AND i.emailSentAt >= :since ORDER BY i.emailSentAt DESC")
    List<Invoice> findRecentlySentInvoices(@Param("since") LocalDateTime since);

    @Query("SELECT i FROM Invoice i WHERE LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.order.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.user.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.user.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Invoice> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.createdAt >= :startDate AND i.createdAt <= :endDate")
    long countInvoicesBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
