package com.fascinito.pos.service;

import com.fascinito.pos.entity.OrderRefund;
import com.fascinito.pos.entity.RefundRetrySchedule;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.OrderRefundRepository;
import com.fascinito.pos.repository.RefundRetryScheduleRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service for handling Razorpay refund operations and periodic status tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundService {

    private final RazorpayClient razorpayClient;
    private final OrderRefundRepository orderRefundRepository;
    private final RefundRetryScheduleRepository refundRetryScheduleRepository;

    @Autowired
    @Lazy
    private OrderService orderService;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    /**
     * Create refund on Razorpay
     * This should be called after OrderRefund is created in OrderService
     */
    @Transactional
    public void processRefundOnRazorpay(Long refundId) {
        OrderRefund refund = orderRefundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found"));

        try {
            // Get payment details
            String razorpayPaymentId = refund.getOrder().getPayment().getRazorpayPaymentId();
            if (razorpayPaymentId == null) {
                throw new IllegalArgumentException("Razorpay payment ID not found for this order");
            }

            // Convert amount to paise
            long amountInPaise = refund.getRefundAmount().multiply(new BigDecimal("100")).longValue();

            log.info("Processing refund for order {} - Payment ID: {}, Amount: {} INR ({} paise)",
                    refund.getOrder().getId(), razorpayPaymentId, refund.getRefundAmount(), amountInPaise);

            // NOTE: Do NOT add notes to the refund request body
            // Razorpay refund API doesn't accept notes in the request
            // We log our metadata separately for audit trail
            log.debug("Refund metadata - Order ID: {}, Type: {}, Reason: Customer order cancellation",
                    refund.getOrder().getId(), refund.getRefundType().toString());

            // Create refund via Razorpay API
            // Use the correct Razorpay API method: POST /payments/{id}/refund
            log.info("DEBUG: About to call Razorpay refund API");
            log.info("DEBUG: Payment ID type: {}, Value: {}", razorpayPaymentId.getClass().getName(), razorpayPaymentId);
            log.info("DEBUG: Amount in paise: {} ({})", amountInPaise, Long.class.getName());

            com.razorpay.Refund razorpayRefund;
            JSONObject refundRequest = new JSONObject();

            if (refund.getRefundType() == OrderRefund.RefundType.PARTIAL) {
                // PARTIAL refund: send only amount parameter
                refundRequest.put("amount", amountInPaise);
                log.debug("PARTIAL refund request - Amount in paise: {}", amountInPaise);
            } else {
                // FULL refund: For FULL refunds, Razorpay requires the amount parameter
                // NOT sending amount = error, so we must send the full amount
                refundRequest.put("amount", amountInPaise);
                log.debug("FULL refund request - Amount in paise (full amount): {}", amountInPaise);
            }

            log.debug("Refund request payload being sent to Razorpay: {}", refundRequest.toString());
            log.info("DEBUG: Calling refund with paymentId={}, request={}", razorpayPaymentId, refundRequest);

            razorpayRefund = razorpayClient.payments.refund(razorpayPaymentId, refundRequest);
            log.info("DEBUG: Refund API call succeeded");
            String razorpayRefundId = razorpayRefund.get("id");

            log.info("Razorpay Refund Response - ID: {}, Status: {}", razorpayRefundId, razorpayRefund.get("status"));

            log.info("Refund created on Razorpay: {} for payment: {}", razorpayRefundId, razorpayPaymentId);

            // Update refund with Razorpay refund ID and status
            orderService.updateRefundStatus(refundId, "PROCESSING", razorpayRefundId, null);

        } catch (RazorpayException e) {
            String errorMessage = e.getMessage();
            log.error("Razorpay exception for refund ID {}: {}", refundId, errorMessage, e);

            // ✅ NEW: Detect settlement hold error
            if (errorMessage != null && errorMessage.contains("BAD_REQUEST_ERROR")) {
                log.warn("Settlement hold detected for refund {} - Payment is in settlement period", refundId);

                // Calculate settlement date (11 days from now)
                LocalDateTime settlementDate = LocalDateTime.now().plusDays(11);
                String settlementDateStr = settlementDate.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));

                String message = "Refund will be processed after settlement completes. Expected: " + settlementDateStr +
                                ". You don't need to do anything - we'll handle this automatically.";

                // Update refund with PENDING_SETTLEMENT status (not FAILED)
                orderService.updateRefundStatus(refundId, "PENDING_SETTLEMENT", null, message);

                // Store settlement expected date in the existing refund object
                refund.setSettlementExpectedDate(settlementDate);
                orderRefundRepository.save(refund);

                // ✅ NEW: Schedule automatic retry after settlement date
                scheduleRefundRetry(refundId, settlementDate);

            } else {
                // Real error - mark as FAILED
                log.error("Real error - marking refund as FAILED");
                orderService.updateRefundStatus(refundId, "FAILED", null, errorMessage);
            }
        } catch (Exception e) {
            log.error("Unexpected error processing refund on Razorpay for refund ID {}: {}", refundId, e.getMessage(), e);
            orderService.updateRefundStatus(refundId, "FAILED", null, e.getMessage());
        }
    }

    /**
     * Scheduled job to check refund status from Razorpay
     * Runs every 5 minutes to check pending refunds
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes
    @Transactional
    public void checkRefundStatus() {
        log.info("Starting scheduled refund status check");

        try {
            List<OrderRefund> pendingRefunds = orderRefundRepository.findByRefundStatus(OrderRefund.RefundStatus.PROCESSING);

            if (pendingRefunds.isEmpty()) {
                log.debug("No pending refunds to check");
                return;
            }

            log.info("Checking status for {} pending refunds", pendingRefunds.size());

            for (OrderRefund refund : pendingRefunds) {
                try {
                    checkSingleRefundStatus(refund);
                } catch (Exception e) {
                    log.error("Error checking refund status for refund ID {}: {}", refund.getId(), e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("Error in scheduled refund status check: {}", e.getMessage(), e);
        }
    }

    /**
     * Check status of a single refund on Razorpay
     */
    private void checkSingleRefundStatus(OrderRefund refund) throws RazorpayException {
        String razorpayRefundId = refund.getRazorpayRefundId();

        if (razorpayRefundId == null) {
            log.warn("Refund ID {} has no Razorpay refund ID", refund.getId());
            return;
        }

        // Fetch refund status from Razorpay
        com.razorpay.Refund razorpayRefund = razorpayClient.refunds.fetch(razorpayRefundId);
        String status = razorpayRefund.get("status");

        log.info("Razorpay refund {} status: {}", razorpayRefundId, status);

        // Map Razorpay status to our status
        String newStatus;
        String failureReason = null;

        switch (status.toLowerCase()) {
            case "processed":
                newStatus = "SUCCESS";
                break;
            case "failed":
                newStatus = "FAILED";
                failureReason = razorpayRefund.has("failure_reason") ?
                        razorpayRefund.get("failure_reason").toString() : "Refund failed";
                break;
            case "pending":
                // Still processing, keep as PROCESSING
                log.debug("Refund {} still processing on Razorpay", razorpayRefundId);
                return;
            default:
                log.warn("Unknown refund status from Razorpay: {}", status);
                return;
        }

        // Update refund status
        orderService.updateRefundStatus(refund.getId(), newStatus, razorpayRefundId, failureReason);

        log.info("Updated refund {} status to {}", refund.getId(), newStatus);
    }

    /**
     * Manually trigger refund processing (for testing or manual intervention)
     */
    @Transactional
    public void triggerRefundProcessing(Long refundId) {
        log.info("Manually triggering refund processing for refund ID {}", refundId);
        processRefundOnRazorpay(refundId);
    }

    /**
     * Get refund status from Razorpay
     */
    @Transactional(readOnly = true)
    public String getRefundStatusFromRazorpay(String razorpayRefundId) throws RazorpayException {
        com.razorpay.Refund razorpayRefund = razorpayClient.refunds.fetch(razorpayRefundId);
        return razorpayRefund.get("status").toString();
    }

    /**
     * Schedule a refund to be retried after settlement completes
     * This is called when a settlement hold is detected
     */
    private void scheduleRefundRetry(Long refundId, LocalDateTime retryAt) {
        try {
            RefundRetrySchedule schedule = RefundRetrySchedule.builder()
                    .refundId(refundId)
                    .retryAt(retryAt)
                    .status("PENDING")
                    .retryCount(0)
                    .build();

            refundRetryScheduleRepository.save(schedule);
            log.info("Scheduled refund {} to retry at {} (settlement date)", refundId, retryAt);
        } catch (Exception e) {
            log.error("Failed to schedule refund retry for refund ID {}: {}", refundId, e.getMessage(), e);
        }
    }
}
