package com.fascinito.pos.service;

import com.fascinito.pos.entity.RefundRetrySchedule;
import com.fascinito.pos.repository.RefundRetryScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for handling automatic refund retry scheduling
 * Retries refunds that were blocked due to settlement hold after settlement completes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundRetryScheduler {

    private final RefundRetryScheduleRepository refundRetryScheduleRepository;
    private final RefundService refundService;

    /**
     * Scheduled job to retry pending refunds after settlement completes
     * Runs every hour to check for pending retries
     */
    @Scheduled(fixedDelay = 3600000) // 1 hour
    @Transactional
    public void retryPendingRefunds() {
        log.info("Starting scheduled refund retry check");

        try {
            // Find all pending retries that are due (retryAt <= now)
            List<RefundRetrySchedule> pendingRetries = refundRetryScheduleRepository
                    .findByStatusAndRetryAtBefore("PENDING", LocalDateTime.now());

            if (pendingRetries.isEmpty()) {
                log.debug("No pending refunds to retry");
                return;
            }

            log.info("Found {} refunds ready for retry (settlement should be complete)", pendingRetries.size());

            for (RefundRetrySchedule schedule : pendingRetries) {
                try {
                    log.info("Retrying refund {} (settlement should be complete)", schedule.getRefundId());

                    // Try to process the refund again
                    refundService.processRefundOnRazorpay(schedule.getRefundId());

                    // Mark as completed
                    schedule.setStatus("COMPLETED");
                    refundRetryScheduleRepository.save(schedule);

                    log.info("Successfully retried refund {}", schedule.getRefundId());

                } catch (Exception e) {
                    log.error("Retry failed for refund {}: {}", schedule.getRefundId(), e.getMessage(), e);

                    // Update retry count and last error
                    schedule.setRetryCount(schedule.getRetryCount() + 1);
                    schedule.setLastError(e.getMessage());

                    // Give up after 5 retries
                    if (schedule.getRetryCount() >= 5) {
                        log.warn("Refund {} has failed 5 retries. Marking as FAILED.", schedule.getRefundId());
                        schedule.setStatus("FAILED");
                    }

                    refundRetryScheduleRepository.save(schedule);
                }
            }

        } catch (Exception e) {
            log.error("Error in scheduled refund retry check: {}", e.getMessage(), e);
        }
    }
}
