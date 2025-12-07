package com.fascinito.pos.service;

import com.fascinito.pos.dto.payment.PaymentVerificationRequest;
import com.fascinito.pos.dto.payment.PaymentVerificationResponse;
import com.fascinito.pos.dto.payment.RazorpayOrderRequest;
import com.fascinito.pos.dto.payment.RazorpayOrderResponse;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.entity.Payment;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.OrderRepository;
import com.fascinito.pos.repository.PaymentRepository;
import com.fascinito.pos.repository.UserRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Formatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayService {

    private final RazorpayClient razorpayClient;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Value("${razorpay.currency}")
    private String currency;

    /**
     * Create Razorpay order for payment
     */
    public RazorpayOrderResponse createRazorpayOrder(Long userId, Long orderId) throws RazorpayException {
        log.info("Creating Razorpay order for user {} and order {}", userId, orderId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Verify the order belongs to the user
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to order");
        }

        // Convert amount to paise (Razorpay uses smallest currency unit)
        long amountInPaise = order.getTotalAmount().multiply(new BigDecimal("100")).longValue();

        // Create Razorpay order
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", order.getOrderNumber());

        // Add notes
        JSONObject notes = new JSONObject();
        notes.put("order_id", orderId);
        notes.put("user_id", userId);
        notes.put("order_number", order.getOrderNumber());
        orderRequest.put("notes", notes);

        // Create order via Razorpay API
        com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        String razorpayOrderId = razorpayOrder.get("id");

        log.info("Razorpay order created: {}", razorpayOrderId);

        // Create or update payment record
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElse(Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .currency(currency)
                        .paymentMethod(Payment.PaymentMethod.RAZORPAY)
                        .status(Payment.PaymentStatus.PENDING)
                        .build());

        payment.setRazorpayOrderId(razorpayOrderId);
        paymentRepository.save(payment);

        // Build response
        return RazorpayOrderResponse.builder()
                .orderId(razorpayOrderId)
                .orderIdDb(orderId)
                .currency(currency)
                .amount(amountInPaise)
                .keyId(keyId)
                .userName(user.getFirstName() + " " + user.getLastName())
                .userEmail(user.getEmail())
                .userPhone(user.getPhone())
                .receipt(order.getOrderNumber())
                .build();
    }

    /**
     * Verify Razorpay payment signature
     */
    @Transactional
    public PaymentVerificationResponse verifyPayment(Long userId, PaymentVerificationRequest request) {
        log.info("Verifying payment for order {}", request.getOrderId());

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Verify the order belongs to the user
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to order");
        }

        Payment payment = paymentRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        // Verify signature
        boolean isValid = verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (isValid) {
            // Update payment status
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            payment.setTransactionId(request.getRazorpayPaymentId());
            payment.setStatus(Payment.PaymentStatus.COMPLETED);
            paymentRepository.save(payment);

            // Update order status
            order.setStatus(Order.OrderStatus.CONFIRMED);
            orderRepository.save(order);

            log.info("Payment verified successfully for order {}", order.getId());

            return PaymentVerificationResponse.builder()
                    .success(true)
                    .message("Payment successful")
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .build();
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Invalid signature");
            paymentRepository.save(payment);

            log.error("Payment verification failed for order {}", order.getId());

            return PaymentVerificationResponse.builder()
                    .success(false)
                    .message("Payment verification failed")
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .build();
        }
    }

    /**
     * Verify Razorpay signature using HMAC SHA256
     */
    private boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            String generatedSignature = calculateHMAC(payload, keySecret);
            return generatedSignature.equals(signature);
        } catch (Exception e) {
            log.error("Error verifying signature", e);
            return false;
        }
    }

    /**
     * Calculate HMAC SHA256
     */
    private String calculateHMAC(String data, String key) throws NoSuchAlgorithmException, InvalidKeyException {
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

        // Convert to hex string
        Formatter formatter = new Formatter();
        for (byte b : hash) {
            formatter.format("%02x", b);
        }
        String result = formatter.toString();
        formatter.close();
        return result;
    }

    /**
     * Handle payment failure
     */
    @Transactional
    public void handlePaymentFailure(Long userId, Long orderId, String reason) {
        log.info("Handling payment failure for order {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Verify the order belongs to the user
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to order");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        payment.setStatus(Payment.PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        paymentRepository.save(payment);

        log.info("Payment failure recorded for order {}", orderId);
    }
}
