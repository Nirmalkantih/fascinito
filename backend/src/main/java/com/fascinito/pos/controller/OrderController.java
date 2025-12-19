package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.order.*;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {
    private final OrderService orderService;
    private final UserRepository userRepository;

    /**
     * Create order from cart (Checkout)
     * POST /api/orders/checkout
     * Body: {shippingAddress, billingAddress, notes, discount, paymentMethod}
     */
    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @RequestBody CheckoutRequest checkoutRequest) {
        Long userId = getCurrentUserId();
        log.info("User {} initiating checkout", userId);
        OrderResponse order = orderService.createOrderFromCart(userId, checkoutRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(order));
    }

    /**
     * Get order by ID
     * GET /api/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable Long orderId) {
        OrderResponse order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    /**
     * Get current user's orders
     * GET /api/orders
     * Parameters: page, size
     */
    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getUserOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getUserOrders(userId, pageable);

        PageResponse<OrderResponse> pageResponse = PageResponse.<OrderResponse>builder()
                .content(orders.getContent())
                .pageNumber(orders.getNumber())
                .pageSize(orders.getSize())
                .totalElements(orders.getTotalElements())
                .totalPages(orders.getTotalPages())
                .first(orders.isFirst())
                .last(orders.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    /**
     * Get all orders by status (Admin only)
     * GET /api/orders/status/{status}
     * Parameters: page, size
     * Status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getOrdersByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getOrdersByStatus(
                Order.OrderStatus.valueOf(status.toUpperCase()), pageable);

        PageResponse<OrderResponse> pageResponse = PageResponse.<OrderResponse>builder()
                .content(orders.getContent())
                .pageNumber(orders.getNumber())
                .pageSize(orders.getSize())
                .totalElements(orders.getTotalElements())
                .totalPages(orders.getTotalPages())
                .first(orders.isFirst())
                .last(orders.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    /**
     * Get all orders (Admin only)
     * GET /api/orders/admin/all
     * Parameters: page, size
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getAllOrders(pageable);

        PageResponse<OrderResponse> pageResponse = PageResponse.<OrderResponse>builder()
                .content(orders.getContent())
                .pageNumber(orders.getNumber())
                .pageSize(orders.getSize())
                .totalElements(orders.getTotalElements())
                .totalPages(orders.getTotalPages())
                .first(orders.isFirst())
                .last(orders.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    /**
     * Update order status (Admin only)
     * PUT /api/orders/{orderId}/status
     * Body: {status}
     * Status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
     */
    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody OrderStatusRequest statusRequest) {
        OrderResponse order = orderService.updateOrderStatus(orderId, statusRequest.getStatus());
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    /**
     * Cancel order with reason (Customer/Admin)
     * POST /api/orders/{orderId}/cancel
     * Body: {cancellationReasonId, customMessage}
     */
    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrderWithReason(
            @PathVariable Long orderId,
            @RequestBody CancelOrderRequest request) {
        Long userId = getCurrentUserId();
        log.info("User {} requesting to cancel order {}", userId, orderId);
        OrderResponse order = orderService.cancelOrderWithReason(orderId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    /**
     * Cancel order and restore stock (Legacy endpoint)
     * DELETE /api/orders/{orderId}
     */
    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> cancelOrder(@PathVariable Long orderId) {
        orderService.cancelOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Initiate refund for cancelled order (Admin only)
     * POST /api/orders/{orderId}/refund
     * Body: {refundType, refundAmount}
     */
    @PostMapping("/{orderId}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RefundResponse>> initiateRefund(
            @PathVariable Long orderId,
            @RequestBody InitiateRefundRequest request) {
        Long adminId = getCurrentUserId();
        log.info("Admin {} initiating refund for order {}", adminId, orderId);
        RefundResponse refund = orderService.initiateRefund(orderId, adminId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(refund));
    }

    /**
     * Get refund details for an order
     * GET /api/orders/{orderId}/refund
     */
    @GetMapping("/{orderId}/refund")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<RefundResponse>> getOrderRefund(@PathVariable Long orderId) {
        log.info("Fetching refund details for order {}", orderId);
        RefundResponse refund = orderService.getOrderRefund(orderId);
        return ResponseEntity.ok(ApiResponse.success(refund));
    }

    /**
     * Get current authenticated user ID
     */
    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        // Try to find user by email or phone (username could be either)
        User user = userRepository.findByEmail(username)
                .or(() -> userRepository.findByPhone(username))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getId();
    }

    /**
     * DTO for updating order status
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class OrderStatusRequest {
        private String status;
    }
}
