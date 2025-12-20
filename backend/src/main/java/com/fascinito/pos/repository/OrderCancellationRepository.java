package com.fascinito.pos.repository;

import com.fascinito.pos.entity.OrderCancellation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderCancellationRepository extends JpaRepository<OrderCancellation, Long> {

    Optional<OrderCancellation> findByOrderId(Long orderId);

    List<OrderCancellation> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
