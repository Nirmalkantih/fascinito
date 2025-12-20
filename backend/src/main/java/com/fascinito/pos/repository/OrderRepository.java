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

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumber(@Param("orderNumber") String orderNumber);

    // OPTIMIZED: With batch loading for related entities
    // Items and their products will be batch-fetched using @BatchSize
    @Query("SELECT o FROM Order o WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    Page<Order> findByUser(@Param("userId") Long userId, Pageable pageable);

    // Alternative method for User entity instead of User object
    Page<Order> findByUser(User user, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status = :status ORDER BY o.createdAt DESC")
    Page<Order> findByStatus(@Param("status") Order.OrderStatus status, Pageable pageable);

    List<Order> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // OPTIMIZED: Fetch order items with product details and images
    @Query("SELECT DISTINCT oi FROM OrderItem oi " +
           "LEFT JOIN FETCH oi.product p " +
           "LEFT JOIN FETCH p.images " +
           "WHERE oi.order.id = :orderId")
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

