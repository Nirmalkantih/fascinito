package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    @Query("SELECT i FROM Invoice i WHERE i.user.id = :userId ORDER BY i.generatedAt DESC")
    Page<Invoice> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE (:search IS NULL OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.order.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.user.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.user.lastName) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY i.generatedAt DESC")
    Page<Invoice> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.emailSent = true")
    long countEmailsSent();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.emailSent = false")
    long countEmailsFailed();
}
