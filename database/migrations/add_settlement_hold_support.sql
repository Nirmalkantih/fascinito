-- Migration: Add settlement hold support for refunds
-- This migration adds support for automatic refund retry after settlement completes

-- Add settlement_expected_date column to order_refunds table
ALTER TABLE order_refunds ADD COLUMN IF NOT EXISTS settlement_expected_date TIMESTAMP;

-- Update CHECK constraint to allow PENDING_SETTLEMENT status
-- (this is needed because we detect settlement hold and mark refund as PENDING_SETTLEMENT instead of FAILED)
ALTER TABLE order_refunds DROP CONSTRAINT IF EXISTS order_refunds_refund_status_check;
ALTER TABLE order_refunds ADD CONSTRAINT order_refunds_refund_status_check
  CHECK (refund_status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'PENDING_SETTLEMENT'));

-- Create table for tracking pending refund retries
CREATE TABLE IF NOT EXISTS refund_retry_schedule (
    id BIGSERIAL PRIMARY KEY,
    refund_id BIGINT NOT NULL REFERENCES order_refunds(id) ON DELETE CASCADE,
    retry_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_refund_retry_schedule_status_retry_at
    ON refund_retry_schedule(status, retry_at);

CREATE INDEX IF NOT EXISTS idx_refund_retry_schedule_refund_id
    ON refund_retry_schedule(refund_id);

-- Add comment for documentation
COMMENT ON TABLE refund_retry_schedule IS 'Tracks refunds that need to be retried after settlement hold completes';
COMMENT ON COLUMN refund_retry_schedule.retry_at IS 'The time when the refund should be retried (after settlement completes)';
COMMENT ON COLUMN refund_retry_schedule.status IS 'Status of the retry schedule: PENDING, COMPLETED, or FAILED';
COMMENT ON COLUMN refund_retry_schedule.retry_count IS 'Number of times this refund has been retried';
