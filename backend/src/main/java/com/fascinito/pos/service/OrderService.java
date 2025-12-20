package com.fascinito.pos.service;

import com.fascinito.pos.dto.order.CheckoutRequest;
import com.fascinito.pos.dto.order.OrderResponse;
import com.fascinito.pos.entity.*;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.OrderRepository;
import com.fascinito.pos.repository.OrderItemRepository;
import com.fascinito.pos.repository.CartItemRepository;
import com.fascinito.pos.repository.ProductRepository;
import com.fascinito.pos.repository.ProductVariantCombinationRepository;
import com.fascinito.pos.repository.VariationOptionRepository;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.repository.PaymentRepository;
import com.fascinito.pos.repository.OrderStatusHistoryRepository;
import com.fascinito.pos.repository.CancellationReasonRepository;
import com.fascinito.pos.repository.OrderCancellationRepository;
import com.fascinito.pos.repository.OrderRefundRepository;
import com.fascinito.pos.dto.order.CancelOrderRequest;
import com.fascinito.pos.dto.order.InitiateRefundRequest;
import com.fascinito.pos.dto.order.RefundResponse;
import com.fascinito.pos.dto.order.RequestRefundRequest;
import com.fascinito.pos.dto.order.RefundRequestResponse;
import com.fascinito.pos.repository.RefundRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final ProductVariantCombinationRepository variantCombinationRepository;
    private final VariationOptionRepository variationOptionRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final CancellationReasonRepository cancellationReasonRepository;
    private final OrderCancellationRepository orderCancellationRepository;
    private final OrderRefundRepository orderRefundRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final RefundService refundService;

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

        // Create order items and DEDUCT STOCK
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            ProductVariantCombination variantCombination = cartItem.getVariantCombination();
            VariationOption variationOption = cartItem.getVariationOption();

            // Determine price from variant combination, product sale price, or regular price
            BigDecimal price;
            if (variantCombination != null && variantCombination.getPrice() != null) {
                price = variantCombination.getPrice();
            } else {
                price = product.getSalePrice() != null ? product.getSalePrice() : product.getRegularPrice();
            }

            BigDecimal itemSubtotal = price.multiply(new BigDecimal(cartItem.getQuantity()));

            // CRITICAL: Deduct stock from variant combination, variation option, or product
            deductStock(product, variantCombination, variationOption, cartItem.getQuantity());

            // NOTE: Tax is already calculated at order level (from cart).
            // Do NOT calculate per-item tax to avoid double-counting.
            // The taxAmount field remains zero at the item level.
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .variationOption(variationOption)
                    .variantCombination(variantCombination)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(price)
                    .subtotal(itemSubtotal)
                    .taxAmount(BigDecimal.ZERO)  // Tax is at order level, not per item
                    .totalPrice(itemSubtotal)  // Total price = subtotal (tax applied at order level)
                    .build();

            order.getItems().add(orderItem);
            subtotal = subtotal.add(itemSubtotal);

            log.info("Created order item for product {} with quantity {}, variantCombination: {}, variationOption: {}",
                    product.getId(), cartItem.getQuantity(),
                    variantCombination != null ? variantCombination.getId() : "null",
                    variationOption != null ? variationOption.getId() : "null");
        }

        // Use pre-calculated values from cart instead of recalculating
        BigDecimal taxAmount = checkoutRequest.getTax() != null ? checkoutRequest.getTax() : BigDecimal.ZERO;
        BigDecimal shippingCost = checkoutRequest.getShipping() != null ? checkoutRequest.getShipping() : BigDecimal.ZERO;
        BigDecimal discount = order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(taxAmount).add(shippingCost).subtract(discount);

        order.setSubtotal(subtotal);
        order.setTaxAmount(taxAmount);
        order.setShippingCost(shippingCost);
        order.setTotalAmount(totalAmount);

        // Save order
        Order savedOrder = orderRepository.save(order);
        log.info("Order {} created successfully with total {}", orderNumber, totalAmount);

        // Create initial status history
        OrderStatusHistory initialHistory = OrderStatusHistory.builder()
                .order(savedOrder)
                .status(Order.OrderStatus.PENDING)
                .updatedBy(user.getEmail())
                .notes("Order created")
                .build();
        statusHistoryRepository.save(initialHistory);

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
                if (cartItem.getVariantCombination() != null) {
                    // Check variant combination stock (highest priority)
                    Integer availableStock = cartItem.getVariantCombination().getStock();
                    if (availableStock == null || availableStock < cartItem.getQuantity()) {
                        throw new IllegalArgumentException(
                                "Insufficient stock for " + product.getTitle() +
                                        " - " + cartItem.getVariantCombination().getCombinationName() +
                                        ". Available: " + (availableStock != null ? availableStock : 0)
                        );
                    }
                } else if (cartItem.getVariationOption() != null) {
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
     * CRITICAL: Deduct stock from variant combination, variation option, or product
     */
    private void deductStock(Product product, ProductVariantCombination variantCombination, 
                            VariationOption variationOption, Integer quantity) {
        if (!product.getTrackInventory()) {
            return; // Skip if inventory tracking is disabled
        }

        if (variantCombination != null) {
            // Deduct from variant combination stock (highest priority)
            Integer currentStock = variantCombination.getStock();
            variantCombination.setStock(currentStock - quantity);
            variantCombinationRepository.save(variantCombination);
            log.info("Deducted {} units from variant combination {} stock. New stock: {}",
                    quantity, variantCombination.getId(), variantCombination.getStock());
            
            // CRITICAL FIX: Also deduct from individual variation options that make up this combination
            if (variantCombination.getOptions() != null && !variantCombination.getOptions().isEmpty()) {
                for (ProductVariantCombinationOption combinationOption : variantCombination.getOptions()) {
                    VariationOption option = combinationOption.getVariationOption();
                    if (option != null) {
                        Integer optionStock = option.getStockQuantity();
                        option.setStockQuantity(optionStock - quantity);
                        variationOptionRepository.save(option);
                        log.info("Deducted {} units from variation option {} ({}) stock. New stock: {}",
                                quantity, option.getId(), option.getName(), option.getStockQuantity());
                    }
                }
            }
        } else if (variationOption != null) {
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
        // Use custom query that doesn't eagerly fetch relationships to avoid MultipleBagFetchException
        Order order = orderRepository.findByIdWithoutRelations(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Fetch items with products (but NOT images yet to avoid MultipleBagFetchException)
        List<OrderItem> items = orderRepository.findItemsByOrderId(orderId);

        // ✅ FIX: Fetch product images separately to avoid "cannot simultaneously fetch multiple bags" error
        if (!items.isEmpty()) {
            List<Long> productIds = items.stream()
                    .map(item -> item.getProduct().getId())
                    .distinct()
                    .collect(Collectors.toList());

            // Fetch products with images in a separate query
            java.util.Map<Long, Product> productsWithImages = orderRepository.findProductsWithImages(productIds)
                    .stream()
                    .collect(Collectors.toMap(Product::getId, p -> p));

            // Replace products in items with ones that have images loaded
            items.forEach(item -> {
                Product productWithImages = productsWithImages.get(item.getProduct().getId());
                if (productWithImages != null) {
                    item.setProduct(productWithImages);
                }
            });
        }

        // Fetch related collections separately to avoid MultipleBagFetchException
        List<OrderStatusHistory> statusHistory = orderRepository.findStatusHistoryByOrderId(orderId);
        order.setStatusHistory(statusHistory);

        List<OrderRefund> refunds = orderRepository.findRefundsByOrderId(orderId);
        order.setRefunds(refunds);

        List<RefundRequest> refundRequests = orderRepository.findRefundRequestsByOrderId(orderId);
        order.setRefundRequests(refundRequests);

        // Map to response - pass the pre-fetched items to avoid lazy loading
        return mapToResponse(order, items);
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
     * Get all orders (Admin only)
     * Supports pagination and returns all orders in the system
     */
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        log.debug("Fetching all orders with pagination");
        return orderRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Update order status (admin only)
     * Creates a status history record for tracking
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Order.OrderStatus status = Order.OrderStatus.valueOf(newStatus.toUpperCase());
        Order.OrderStatus previousStatus = order.getStatus();
        
        // Only create history if status actually changed
        if (previousStatus != status) {
            order.setStatus(status);
            orderRepository.save(order);

            // Get current user for tracking who updated the status
            String updatedBy = getCurrentUsername();

            // Create status history record
            OrderStatusHistory history = OrderStatusHistory.builder()
                    .order(order)
                    .status(status)
                    .updatedBy(updatedBy)
                    .notes("Status updated from " + previousStatus + " to " + status)
                    .build();
            statusHistoryRepository.save(history);

            log.info("Updated order {} status from {} to {} by {}", orderId, previousStatus, newStatus, updatedBy);
        } else {
            log.debug("Order {} status unchanged: {}", orderId, status);
        }

        return mapToResponse(order);
    }

    /**
     * Get current authenticated username
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "System";
    }

    /**
     * Cancel order with reason tracking and stock restoration
     */
    @Transactional
    public OrderResponse cancelOrderWithReason(Long orderId, Long userId, CancelOrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Validate order can be cancelled (not delivered or already cancelled)
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Order is already cancelled");
        }
        if (order.getStatus() == Order.OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Cannot cancel a delivered order");
        }
        if (order.getStatus() == Order.OrderStatus.REFUNDED) {
            throw new IllegalArgumentException("Cannot cancel a refunded order");
        }

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Restore stock for all items
        for (OrderItem item : order.getItems()) {
            restoreStock(item.getProduct(), item.getVariantCombination(), item.getVariationOption(), item.getQuantity());
        }

        // Get cancellation reason if provided
        CancellationReason reason = null;
        String reasonText = null;
        if (request.getCancellationReasonId() != null) {
            reason = cancellationReasonRepository.findById(request.getCancellationReasonId())
                    .orElse(null);
            if (reason != null) {
                reasonText = reason.getReasonText();
            }
        }

        // Create OrderCancellation record
        OrderCancellation cancellation = OrderCancellation.builder()
                .order(order)
                .cancellationReason(reason)
                .customMessage(request.getCustomMessage())
                .cancelledBy(currentUser)
                .cancelledAt(LocalDateTime.now())
                .build();
        orderCancellationRepository.save(cancellation);

        // Update order status and cancellation fields
        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setCancellationReason(reasonText != null ? reasonText : "User cancelled");
        order.setCancellationMessage(request.getCustomMessage());
        order.setCancelledAt(LocalDateTime.now());

        // Set refund status based on payment status
        if (order.getPayment() != null && order.getPayment().getStatus() == Payment.PaymentStatus.COMPLETED) {
            order.setRefundStatus("PENDING");
        } else {
            order.setRefundStatus("NOT_REQUIRED");
        }

        orderRepository.save(order);

        // Create status history record
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(Order.OrderStatus.CANCELLED)
                .updatedBy(currentUser.getEmail())
                .notes("Order cancelled: " + (reasonText != null ? reasonText : "User initiated cancellation"))
                .build();
        statusHistoryRepository.save(history);

        log.info("Cancelled order {} by user {} with reason: {}", orderId, userId, reasonText);

        return mapToResponse(order);
    }

    /**
     * Legacy cancelOrder method for compatibility
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
            restoreStock(item.getProduct(), item.getVariantCombination(), item.getVariationOption(), item.getQuantity());
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);

        log.info("Cancelled order {} and restored stock", orderId);
    }

    /**
     * Restore stock when order is cancelled
     */
    private void restoreStock(Product product, ProductVariantCombination variantCombination,
                             VariationOption variationOption, Integer quantity) {
        if (!product.getTrackInventory()) {
            return;
        }

        if (variantCombination != null) {
            Integer currentStock = variantCombination.getStock();
            variantCombination.setStock(currentStock + quantity);
            variantCombinationRepository.save(variantCombination);
            log.info("Restored {} units to variant combination {} stock. New stock: {}",
                    quantity, variantCombination.getId(), variantCombination.getStock());
            
            // CRITICAL FIX: Also restore stock to individual variation options that make up this combination
            if (variantCombination.getOptions() != null && !variantCombination.getOptions().isEmpty()) {
                for (ProductVariantCombinationOption combinationOption : variantCombination.getOptions()) {
                    VariationOption option = combinationOption.getVariationOption();
                    if (option != null) {
                        Integer optionStock = option.getStockQuantity();
                        option.setStockQuantity(optionStock + quantity);
                        variationOptionRepository.save(option);
                        log.info("Restored {} units to variation option {} ({}) stock. New stock: {}",
                                quantity, option.getId(), option.getName(), option.getStockQuantity());
                    }
                }
            }
        } else if (variationOption != null) {
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
     * Initiate refund for cancelled order
     */
    @Transactional
    public RefundResponse initiateRefund(Long orderId, Long adminId, InitiateRefundRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Validate order is cancelled and paid
        if (order.getStatus() != Order.OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Only cancelled orders can be refunded");
        }

        if (order.getPayment() == null || order.getPayment().getStatus() != Payment.PaymentStatus.COMPLETED) {
            throw new IllegalArgumentException("Order was not paid");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        // Calculate refund amount
        BigDecimal refundAmount;
        if ("FULL".equalsIgnoreCase(request.getRefundType())) {
            refundAmount = order.getPayment().getAmount();
        } else if ("PARTIAL".equalsIgnoreCase(request.getRefundType())) {
            if (request.getRefundAmount() == null || request.getRefundAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Partial refund amount must be greater than 0");
            }
            if (request.getRefundAmount().compareTo(order.getPayment().getAmount()) > 0) {
                throw new IllegalArgumentException("Refund amount cannot exceed paid amount");
            }
            refundAmount = request.getRefundAmount();
        } else {
            throw new IllegalArgumentException("Invalid refund type");
        }

        // Create OrderRefund record
        OrderRefund refund = OrderRefund.builder()
                .order(order)
                .refundType(OrderRefund.RefundType.valueOf(request.getRefundType().toUpperCase()))
                .refundAmount(refundAmount)
                .refundStatus(OrderRefund.RefundStatus.PENDING)
                .initiatedBy(admin)
                .build();

        OrderRefund savedRefund = orderRefundRepository.save(refund);

        // Update order refund tracking
        order.setRefundStatus("PENDING");
        order.setRefundAmount(refundAmount);
        orderRepository.save(order);

        log.info("Refund initiated for order {} - Amount: {}, Type: {}, by Admin: {}",
                orderId, refundAmount, request.getRefundType(), adminId);

        // Trigger Razorpay refund processing synchronously to catch errors immediately
        try {
            refundService.processRefundOnRazorpay(savedRefund.getId());

            // Refresh the refund from database to get updated status from RefundService
            OrderRefund updatedRefund = orderRefundRepository.findById(savedRefund.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Refund not found after processing"));
            return mapRefundToResponse(updatedRefund);
        } catch (Exception e) {
            log.error("Error processing refund on Razorpay: {}", e.getMessage(), e);
            // Update refund status to FAILED
            savedRefund.setRefundStatus(OrderRefund.RefundStatus.FAILED);
            savedRefund.setFailureReason(e.getMessage());
            orderRefundRepository.save(savedRefund);

            order.setRefundStatus("FAILED");
            orderRepository.save(order);

            // Return the failed refund response
            return mapRefundToResponse(savedRefund);
        }
    }

    /**
     * Get refund details for an order
     */
    @Transactional(readOnly = true)
    public RefundResponse getOrderRefund(Long orderId) {
        OrderRefund refund = orderRefundRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("No refund found for this order"));
        return mapRefundToResponse(refund);
    }

    /**
     * Get all pending refunds (for scheduled processing)
     */
    @Transactional(readOnly = true)
    public List<OrderRefund> getPendingRefunds() {
        return orderRefundRepository.findByRefundStatus(OrderRefund.RefundStatus.PENDING);
    }

    /**
     * Update refund status (called after Razorpay processing)
     */
    @Transactional
    public void updateRefundStatus(Long refundId, String status, String razorpayRefundId, String failureReason) {
        OrderRefund refund = orderRefundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found"));

        OrderRefund.RefundStatus newStatus = OrderRefund.RefundStatus.valueOf(status.toUpperCase());
        refund.setRefundStatus(newStatus);
        refund.setRazorpayRefundId(razorpayRefundId);
        refund.setFailureReason(failureReason);
        refund.setProcessedAt(LocalDateTime.now());

        orderRefundRepository.save(refund);

        // Update order status
        Order order = refund.getOrder();
        order.setRefundStatus(status);

        if (newStatus == OrderRefund.RefundStatus.SUCCESS) {
            order.setStatus(Order.OrderStatus.REFUNDED);

            // ✅ NEW: Restore inventory for all order items (same as cancelled orders)
            log.info("Refund successful for order {} - restoring inventory", order.getId());
            for (OrderItem orderItem : order.getItems()) {
                restoreStock(
                    orderItem.getProduct(),
                    orderItem.getVariantCombination(),
                    orderItem.getVariationOption(),
                    orderItem.getQuantity()
                );
            }
            log.info("Inventory restored for {} items in order {}", order.getItems().size(), order.getId());
        }

        orderRepository.save(order);

        log.info("Updated refund {} status to {} for order {}", refundId, status, order.getId());
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
        List<OrderItem> items = orderRepository.findItemsByOrderId(order.getId());

        // Initialize product images while session is open
        items.forEach(item -> {
            item.getProduct().getImages().size();
        });

        return mapToResponse(order, items);
    }

    /**
     * Map Order entity to OrderResponse DTO with pre-loaded items
     */
    private OrderResponse mapToResponse(Order order, List<OrderItem> items) {
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
                .items(items.stream()
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
                .statusHistory(order.getStatusHistory() != null ?
                        order.getStatusHistory().stream()
                                .map(this::mapStatusHistoryToResponse)
                                .collect(Collectors.toList()) :
                        new ArrayList<>())
                .cancellationReason(order.getCancellationReason())
                .cancellationMessage(order.getCancellationMessage())
                .cancelledAtTimestamp(order.getCancelledAt() != null ?
                        order.getCancelledAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .refundStatus(order.getRefundStatus())
                .refundAmount(order.getRefundAmount())
                .refund(order.getRefunds() != null && !order.getRefunds().isEmpty() ?
                        mapRefundToResponse(order.getRefunds().get(0)) : null)
                .refundRequest(order.getRefundRequests() != null && !order.getRefundRequests().isEmpty() ?
                        mapRefundRequestToResponse(order.getRefundRequests().get(0)) : null)
                .createdAtTimestamp(order.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .updatedAtTimestamp(order.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .build();
    }

    /**
     * Map OrderStatusHistory entity to OrderStatusHistoryResponse DTO
     */
    private com.fascinito.pos.dto.order.OrderStatusHistoryResponse mapStatusHistoryToResponse(OrderStatusHistory history) {
        return com.fascinito.pos.dto.order.OrderStatusHistoryResponse.builder()
                .id(history.getId())
                .status(history.getStatus().toString())
                .notes(history.getNotes())
                .updatedBy(history.getUpdatedBy())
                .createdAtTimestamp(history.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .build();
    }

    /**
     * Map OrderRefund entity to RefundResponse DTO
     */
    private RefundResponse mapRefundToResponse(OrderRefund refund) {
        return RefundResponse.builder()
                .id(refund.getId())
                .orderId(refund.getOrder().getId())
                .refundType(refund.getRefundType().toString())
                .refundAmount(refund.getRefundAmount())
                .razorpayRefundId(refund.getRazorpayRefundId())
                .refundStatus(refund.getRefundStatus().toString())
                .failureReason(refund.getFailureReason())
                .createdAtTimestamp(refund.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .updatedAtTimestamp(refund.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .build();
    }

    /**
     * Map RefundRequest entity to RefundRequestResponse DTO
     */
    private RefundRequestResponse mapRefundRequestToResponse(RefundRequest refundRequest) {
        return RefundRequestResponse.builder()
                .id(refundRequest.getId())
                .orderId(refundRequest.getOrder().getId())
                .status(refundRequest.getStatus().toString())
                .reason(refundRequest.getReason())
                .comment(refundRequest.getComment())
                .requestedByEmail(refundRequest.getRequestedBy().getEmail())
                .createdAtTimestamp(refundRequest.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .updatedAtTimestamp(refundRequest.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .build();
    }

    /**
     * Request refund for delivered order
     * POST /api/orders/{orderId}/request-refund
     */
    @Transactional
    public RefundRequestResponse requestRefund(Long orderId, Long userId, RequestRefundRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Validate order is in DELIVERED status
        if (!order.getStatus().equals(Order.OrderStatus.DELIVERED)) {
            throw new IllegalArgumentException("Refund can only be requested for DELIVERED orders");
        }

        // Check if order belongs to user (unless admin)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if refund request already exists for this order with PENDING status
        if (refundRequestRepository.existsByOrderIdAndStatus(orderId, RefundRequest.RefundRequestStatus.PENDING)) {
            throw new IllegalArgumentException("A refund request for this order is already pending");
        }

        // Create refund request
        RefundRequest refundRequest = RefundRequest.builder()
                .order(order)
                .requestedBy(user)
                .status(RefundRequest.RefundRequestStatus.PENDING)
                .reason(request.getReason())
                .comment(request.getComment())
                .updatedAt(LocalDateTime.now())
                .build();

        refundRequest = refundRequestRepository.save(refundRequest);

        // Update order status to RETURN_REQUEST
        order.setStatus(Order.OrderStatus.RETURN_REQUEST);
        orderRepository.save(order);

        log.info("Refund request created for order {} by user {}, status changed to RETURN_REQUEST", orderId, userId);

        return mapRefundRequestToResponse(refundRequest);
    }

    /**
     * Approve refund request and enable refund for customer
     * Changes status to APPROVED and order status to RETURN_REQUEST
     */
    @Transactional
    public RefundRequestResponse approveRefundRequest(Long orderId, Long refundRequestId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund request not found"));

        // Validate refund request belongs to this order
        if (!refundRequest.getOrder().getId().equals(orderId)) {
            throw new IllegalArgumentException("Refund request does not belong to this order");
        }

        // Update refund request status to APPROVED
        refundRequest.setStatus(RefundRequest.RefundRequestStatus.APPROVED);
        refundRequest.setUpdatedAt(LocalDateTime.now());
        refundRequest = refundRequestRepository.save(refundRequest);

        log.info("Refund request {} approved for order {}", refundRequestId, orderId);

        return mapRefundRequestToResponse(refundRequest);
    }

    /**
     * Reject refund request
     * Changes status to REJECTED and order status back to DELIVERED
     */
    @Transactional
    public RefundRequestResponse rejectRefundRequest(Long orderId, Long refundRequestId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund request not found"));

        // Validate refund request belongs to this order
        if (!refundRequest.getOrder().getId().equals(orderId)) {
            throw new IllegalArgumentException("Refund request does not belong to this order");
        }

        // Update refund request status to REJECTED
        refundRequest.setStatus(RefundRequest.RefundRequestStatus.REJECTED);
        refundRequest.setUpdatedAt(LocalDateTime.now());
        refundRequest = refundRequestRepository.save(refundRequest);

        // Revert order status back to DELIVERED
        order.setStatus(Order.OrderStatus.DELIVERED);
        orderRepository.save(order);

        log.info("Refund request {} rejected for order {}", refundRequestId, orderId);

        return mapRefundRequestToResponse(refundRequest);
    }
}
