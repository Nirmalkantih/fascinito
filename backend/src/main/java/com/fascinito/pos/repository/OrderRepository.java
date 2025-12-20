package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Order;
import com.fascinito.pos.entity.OrderItem;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.entity.Product;
import com.fascinito.pos.entity.OrderStatusHistory;
import com.fascinito.pos.entity.OrderRefund;
import com.fascinito.pos.entity.RefundRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByUser(User user, Pageable pageable);

    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);

    List<Order> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.product p WHERE oi.order.id = :orderId")
    List<OrderItem> findItemsByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT DISTINCT o FROM Order o WHERE o.id = :orderId")
    Optional<Order> findByIdWithoutRelations(@Param("orderId") Long orderId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id IN :productIds")
    List<Product> findProductsWithImages(@Param("productIds") List<Long> productIds);

    @Query("SELECT sh FROM OrderStatusHistory sh WHERE sh.order.id = :orderId ORDER BY sh.createdAt DESC")
    List<OrderStatusHistory> findStatusHistoryByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT r FROM OrderRefund r WHERE r.order.id = :orderId")
    List<OrderRefund> findRefundsByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT rr FROM RefundRequest rr WHERE rr.order.id = :orderId")
    List<RefundRequest> findRefundRequestsByOrderId(@Param("orderId") Long orderId);
}

