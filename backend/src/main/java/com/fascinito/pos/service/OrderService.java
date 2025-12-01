package com.fascinito.pos.service;

import com.fascinito.pos.dto.order.CheckoutRequest;
import com.fascinito.pos.dto.order.OrderResponse;
import com.fascinito.pos.entity.*;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.OrderRepository;
import com.fascinito.pos.repository.OrderItemRepository;
import com.fascinito.pos.repository.CartItemRepository;
import com.fascinito.pos.repository.ProductRepository;
import com.fascinito.pos.repository.VariationOptionRepository;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final VariationOptionRepository variationOptionRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Create order from cart with stock deduction
     * This is the critical method that implements the checkout flow
     */
    @Transactional
    public OrderResponse createOrderFromCart(Long userId, CheckoutRequest checkoutRequest) {
        log.info("Creating order for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get user's cart
        List<CartItem> cartItems = cartItemRepository.findByUser(user);
        
        // Check if test mode is enabled - allow empty cart in test mode
        boolean isTestMode = Boolean.TRUE.equals(checkoutRequest.getTestMode());
        
        if (cartItems.isEmpty() && !isTestMode) {
            throw new IllegalArgumentException("Cart is empty");
        }

        // In test mode with empty cart, create a dummy order
        if (cartItems.isEmpty() && isTestMode) {
            log.info("Creating test/demo order with empty cart for user {}", userId);
            return createTestOrder(user, checkoutRequest);
        }

        // Validate stock for all items before proceeding
        validateStockAvailability(cartItems);

        // Create order
        String orderNumber = generateOrderNumber();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .status(Order.OrderStatus.PENDING)
                .shippingAddress(checkoutRequest.getShippingAddress())
                .billingAddress(checkoutRequest.getBillingAddress())
                .notes(checkoutRequest.getNotes())
                .discount(checkoutRequest.getDiscount() != null ? checkoutRequest.getDiscount() : BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;

        // Create order items and DEDUCT STOCK
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            BigDecimal price = product.getSalePrice() != null ? product.getSalePrice() : product.getRegularPrice();
            BigDecimal itemSubtotal = price.multiply(new BigDecimal(cartItem.getQuantity()));

            // CRITICAL: Deduct stock from product or variation option
            deductStock(product, cartItem.getVariationOption(), cartItem.getQuantity());

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .variationOption(cartItem.getVariationOption())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(price)
                    .subtotal(itemSubtotal)
                    .taxAmount(itemSubtotal.multiply(new BigDecimal("0.10")))
                    .totalPrice(itemSubtotal.multiply(new BigDecimal("1.10")))
                    .build();

            order.getItems().add(orderItem);
            subtotal = subtotal.add(itemSubtotal);
            taxAmount = taxAmount.add(itemSubtotal.multiply(new BigDecimal("0.10")));

            log.info("Created order item for product {} with quantity {}", product.getId(), cartItem.getQuantity());
        }

        // Calculate totals
        BigDecimal shippingCost = cartItems.isEmpty() ? BigDecimal.ZERO : new BigDecimal("15.00");
        BigDecimal discount = order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(taxAmount).add(shippingCost).subtract(discount);

        order.setSubtotal(subtotal);
        order.setTaxAmount(taxAmount);
        order.setShippingCost(shippingCost);
        order.setTotalAmount(totalAmount);

        // Save order
        Order savedOrder = orderRepository.save(order);
        log.info("Order {} created successfully with total {}", orderNumber, totalAmount);

        // Create payment record
        Payment payment = Payment.builder()
                .order(savedOrder)
                .paymentMethod(Payment.PaymentMethod.valueOf(checkoutRequest.getPaymentMethod().toUpperCase()))
                .status(Payment.PaymentStatus.PENDING)
                .amount(totalAmount)
                .currency("USD")
                .build();
        paymentRepository.save(payment);

        // CLEAR CART after successful order creation
        cartItemRepository.deleteByUser(user);
        log.info("Cart cleared for user {}", userId);

        return mapToResponse(savedOrder);
    }

    /**
     * CRITICAL: Validate stock before order creation
     */
    private void validateStockAvailability(List<CartItem> cartItems) {
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            if (product.getTrackInventory()) {
                if (cartItem.getVariationOption() != null) {
                    // Check variation option stock
                    if (cartItem.getVariationOption().getStockQuantity() < cartItem.getQuantity()) {
                        throw new IllegalArgumentException(
                                "Insufficient stock for " + product.getTitle() +
                                        " - " + cartItem.getVariationOption().getName()
                        );
                    }
                } else {
                    // Check product stock
                    if (product.getStockQuantity() < cartItem.getQuantity()) {
                        throw new IllegalArgumentException(
                                "Insufficient stock for " + product.getTitle()
                        );
                    }
                }
            }
        }
        log.info("Stock validation passed for all cart items");
    }

    /**
     * CRITICAL: Deduct stock from product or variation option
     */
    private void deductStock(Product product, VariationOption variationOption, Integer quantity) {
        if (!product.getTrackInventory()) {
            return; // Skip if inventory tracking is disabled
        }

        if (variationOption != null) {
            // Deduct from variation option stock
            Integer currentStock = variationOption.getStockQuantity();
            variationOption.setStockQuantity(currentStock - quantity);
            variationOptionRepository.save(variationOption);
            log.info("Deducted {} units from variation option {} stock. New stock: {}",
                    quantity, variationOption.getId(), variationOption.getStockQuantity());
        } else {
            // Deduct from product stock
            Integer currentStock = product.getStockQuantity();
            product.setStockQuantity(currentStock - quantity);
            productRepository.save(product);
            log.info("Deducted {} units from product {} stock. New stock: {}",
                    quantity, product.getId(), product.getStockQuantity());
        }
    }

    /**
     * Create a test/demo order with empty cart for testing purposes
     */
    private OrderResponse createTestOrder(User user, CheckoutRequest checkoutRequest) {
        String orderNumber = generateOrderNumber();
        
        // Create order with demo/test data
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .status(Order.OrderStatus.PENDING)
                .shippingAddress(checkoutRequest.getShippingAddress())
                .billingAddress(checkoutRequest.getBillingAddress())
                .notes(checkoutRequest.getNotes() != null ? checkoutRequest.getNotes() : "Test/Demo Order")
                .discount(checkoutRequest.getDiscount() != null ? checkoutRequest.getDiscount() : BigDecimal.ZERO)
                .items(new ArrayList<>())
                .subtotal(BigDecimal.valueOf(100.00))
                .taxAmount(BigDecimal.valueOf(10.00))
                .shippingCost(BigDecimal.valueOf(15.00))
                .totalAmount(BigDecimal.valueOf(125.00))
                .build();

        // Save order
        Order savedOrder = orderRepository.save(order);
        log.info("Test/Demo order {} created successfully with total {}", orderNumber, order.getTotalAmount());

        // Create payment record
        Payment payment = Payment.builder()
                .order(savedOrder)
                .paymentMethod(Payment.PaymentMethod.valueOf(checkoutRequest.getPaymentMethod().toUpperCase()))
                .status(Payment.PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .currency("USD")
                .build();
        paymentRepository.save(payment);

        return mapToResponse(savedOrder);
    }

    /**
     * Get order by ID
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return mapToResponse(order);
    }

    /**
     * Get user's orders
     */
    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return orderRepository.findByUser(user, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get orders by status
     */
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatus(status, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Update order status (admin only)
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Order.OrderStatus status = Order.OrderStatus.valueOf(newStatus.toUpperCase());
        order.setStatus(status);
        orderRepository.save(order);

        log.info("Updated order {} status to {}", orderId, newStatus);
        return mapToResponse(order);
    }

    /**
     * Cancel order and restore stock
     */
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Order is already cancelled");
        }

        // Restore stock for all items
        for (OrderItem item : order.getItems()) {
            restoreStock(item.getProduct(), item.getVariationOption(), item.getQuantity());
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);

        log.info("Cancelled order {} and restored stock", orderId);
    }

    /**
     * Restore stock when order is cancelled
     */
    private void restoreStock(Product product, VariationOption variationOption, Integer quantity) {
        if (!product.getTrackInventory()) {
            return;
        }

        if (variationOption != null) {
            Integer currentStock = variationOption.getStockQuantity();
            variationOption.setStockQuantity(currentStock + quantity);
            variationOptionRepository.save(variationOption);
            log.info("Restored {} units to variation option {} stock. New stock: {}",
                    quantity, variationOption.getId(), variationOption.getStockQuantity());
        } else {
            Integer currentStock = product.getStockQuantity();
            product.setStockQuantity(currentStock + quantity);
            productRepository.save(product);
            log.info("Restored {} units to product {} stock. New stock: {}",
                    quantity, product.getId(), product.getStockQuantity());
        }
    }

    /**
     * Map Payment entity to PaymentResponse DTO
     */
    private com.fascinito.pos.dto.order.PaymentResponse mapPaymentToResponse(Payment payment) {
        return com.fascinito.pos.dto.order.PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder().getId())
                .transactionId(payment.getTransactionId())
                .paymentMethod(payment.getPaymentMethod().toString())
                .status(payment.getStatus().toString())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentDetails(payment.getPaymentDetails())
                .failureReason(payment.getFailureReason())
                .createdAtTimestamp(payment.getCreatedAt() != null ?
                        payment.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .build();
    }

    /**
     * Generate unique order number
     */
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * Map Order entity to OrderResponse DTO
     */
    private OrderResponse mapToResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .userEmail(order.getUser().getEmail())
                .userFirstName(order.getUser().getFirstName())
                .userLastName(order.getUser().getLastName())
                .status(order.getStatus().toString())
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .shippingCost(order.getShippingCost())
                .discount(order.getDiscount())
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddress())
                .billingAddress(order.getBillingAddress())
                .notes(order.getNotes())
                .items(order.getItems().stream()
                        .map(item -> com.fascinito.pos.dto.order.OrderItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProduct().getId())
                                .productName(item.getProduct().getTitle())
                                .productImage(item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()
                                    ? item.getProduct().getImages().get(0).getImageUrl()
                                    : null)
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(item.getSubtotal())
                                .taxAmount(item.getTaxAmount())
                                .totalPrice(item.getTotalPrice())
                                .variationId(item.getVariationOption() != null ? item.getVariationOption().getId() : null)
                                .build())
                        .collect(Collectors.toList()))
                .payment(order.getPayment() != null ? mapPaymentToResponse(order.getPayment()) : null)
                .createdAtTimestamp(order.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .updatedAtTimestamp(order.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .build();
    }
}
