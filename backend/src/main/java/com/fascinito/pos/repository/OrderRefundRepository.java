package com.fascinito.pos.repository;

import com.fascinito.pos.entity.OrderRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRefundRepository extends JpaRepository<OrderRefund, Long> {

    Optional<OrderRefund> findByOrderId(Long orderId);

    List<OrderRefund> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<OrderRefund> findByRefundStatus(OrderRefund.RefundStatus refundStatus);

    Optional<OrderRefund> findByRazorpayRefundId(String razorpayRefundId);

    @Query("SELECT r FROM OrderRefund r WHERE r.refundStatus = 'PROCESSING' ORDER BY r.createdAt ASC")
    List<OrderRefund> findAllProcessingRefunds();
}
