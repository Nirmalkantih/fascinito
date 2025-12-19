package com.fascinito.pos.repository;

import com.fascinito.pos.entity.RefundRetrySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RefundRetryScheduleRepository extends JpaRepository<RefundRetrySchedule, Long> {
    List<RefundRetrySchedule> findByStatusAndRetryAtBefore(String status, LocalDateTime retryAt);
    List<RefundRetrySchedule> findByRefundId(Long refundId);
}
