package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Order;
import com.fascinito.pos.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {
    
    List<OrderStatusHistory> findByOrderOrderByCreatedAtAsc(Order order);
    
    List<OrderStatusHistory> findByOrderIdOrderByCreatedAtAsc(Long orderId);
}
