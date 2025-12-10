-- Add soft delete columns to users table
-- This allows us to mark users as deleted while preserving their data for reference

ALTER TABLE users 
ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER active,
ADD COLUMN deleted_at DATETIME NULL AFTER deleted;

-- Add index on deleted column for better query performance
CREATE INDEX idx_users_deleted ON users(deleted);

-- Add composite index for email and deleted status
CREATE INDEX idx_users_email_deleted ON users(email, deleted);

-- Add composite index for phone and deleted status
CREATE INDEX idx_users_phone_deleted ON users(phone, deleted);

-- Optional: Add comment to the table
ALTER TABLE users COMMENT = 'Users table with soft delete support';
