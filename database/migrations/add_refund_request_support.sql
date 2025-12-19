-- Migration: Add refund request support
-- This migration adds support for customers to request refunds for delivered orders

-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    requested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT refund_requests_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED'))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_refund_requests_order_id
    ON refund_requests(order_id);

CREATE INDEX IF NOT EXISTS idx_refund_requests_status
    ON refund_requests(status);

CREATE INDEX IF NOT EXISTS idx_refund_requests_requested_by
    ON refund_requests(requested_by);

-- Add comment for documentation
COMMENT ON TABLE refund_requests IS 'Stores customer refund requests for delivered orders';
COMMENT ON COLUMN refund_requests.status IS 'Status of refund request: PENDING, APPROVED, REJECTED, PROCESSING, COMPLETED';
COMMENT ON COLUMN refund_requests.reason IS 'Reason provided by customer for requesting refund';
COMMENT ON COLUMN refund_requests.comment IS 'Additional comment/details from customer';
