-- Add order status history table for tracking order status changes
CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    updated_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create initial status history records for existing orders
INSERT INTO order_status_history (order_id, status, notes, updated_by, created_at)
SELECT 
    id,
    status,
    'Initial status',
    'System Migration',
    created_at
FROM orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_status_history);
