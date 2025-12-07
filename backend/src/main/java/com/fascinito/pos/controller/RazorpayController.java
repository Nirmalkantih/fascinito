package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.payment.PaymentVerificationRequest;
import com.fascinito.pos.dto.payment.PaymentVerificationResponse;
import com.fascinito.pos.dto.payment.RazorpayOrderResponse;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.service.RazorpayService;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payment/razorpay")
@RequiredArgsConstructor
@Slf4j
public class RazorpayController {

    private final RazorpayService razorpayService;
    private final UserRepository userRepository;

    /**
     * Create Razorpay order for payment
     */
    @PostMapping("/create-order/{orderId}")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createOrder(
            @PathVariable Long orderId) {
        
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            RazorpayOrderResponse response = razorpayService.createRazorpayOrder(
                    user.getId(), 
                    orderId
            );
            
            return ResponseEntity.ok(
                    ApiResponse.success("Razorpay order created successfully", response)
            );
        } catch (RazorpayException e) {
            log.error("Error creating Razorpay order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create payment order: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating Razorpay order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred"));
        }
    }

    /**
     * Verify Razorpay payment
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentVerificationResponse>> verifyPayment(
            @RequestBody PaymentVerificationRequest request) {
        
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            PaymentVerificationResponse response = razorpayService.verifyPayment(
                    user.getId(), 
                    request
            );
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(
                        ApiResponse.success("Payment verified successfully", response)
                );
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Payment verification failed"));
        }
    }

    /**
     * Handle payment failure
     */
    @PostMapping("/failure/{orderId}")
    public ResponseEntity<ApiResponse<Void>> handlePaymentFailure(
            @PathVariable Long orderId,
            @RequestBody(required = false) String reason) {
        
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            razorpayService.handlePaymentFailure(
                    user.getId(), 
                    orderId, 
                    reason != null ? reason : "Payment cancelled by user"
            );
            
            return ResponseEntity.ok(
                    ApiResponse.success("Payment failure recorded", null)
            );
        } catch (Exception e) {
            log.error("Error handling payment failure", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to record payment failure"));
        }
    }
}
