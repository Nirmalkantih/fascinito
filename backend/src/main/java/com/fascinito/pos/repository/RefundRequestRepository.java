package com.fascinito.pos.repository;

import com.fascinito.pos.entity.RefundRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {

    /**
     * Find refund request by order ID
     */
    Optional<RefundRequest> findByOrderId(Long orderId);

    /**
     * Find all pending refund requests
     */
    Page<RefundRequest> findByStatus(RefundRequest.RefundRequestStatus status, Pageable pageable);

    /**
     * Check if order has an existing refund request
     */
    boolean existsByOrderIdAndStatus(Long orderId, RefundRequest.RefundRequestStatus status);
}
