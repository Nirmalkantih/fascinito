-- ============================================================================
-- Database Migration - Update Cart and Order Items for Variation Options
-- ============================================================================
-- This migration updates the foreign key columns to reference variation_options
-- instead of product_variations, aligning with the new architecture
-- ============================================================================

-- Step 1: Backup existing data (if you have old data)
-- OPTIONAL: Create backups if needed
-- CREATE TABLE cart_items_backup AS SELECT * FROM cart_items;
-- CREATE TABLE order_items_backup AS SELECT * FROM order_items;

-- Step 2: Drop existing foreign key constraints
ALTER TABLE cart_items
  DROP FOREIGN KEY IF EXISTS cart_items_ibfk_3;

ALTER TABLE order_items
  DROP FOREIGN KEY IF EXISTS order_items_ibfk_3;

-- Step 3: Rename the variation_id columns to variation_option_id
ALTER TABLE cart_items
  CHANGE COLUMN variation_id variation_option_id BIGINT;

ALTER TABLE order_items
  CHANGE COLUMN variation_id variation_option_id BIGINT;

-- Step 4: Add new foreign key constraints to variation_options table
ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_ibfk_3
  FOREIGN KEY (variation_option_id) REFERENCES variation_options(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_ibfk_3
  FOREIGN KEY (variation_option_id) REFERENCES variation_options(id) ON DELETE SET NULL;

-- Step 5: Verify the changes
DESCRIBE cart_items;
DESCRIBE order_items;

-- Step 6: Verify foreign keys are correctly set
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME IN ('cart_items', 'order_items') AND COLUMN_NAME = 'variation_option_id';

-- Step 7: Verify data integrity
SELECT COUNT(*) as cart_items_with_options FROM cart_items WHERE variation_option_id IS NOT NULL;
SELECT COUNT(*) as order_items_with_options FROM order_items WHERE variation_option_id IS NOT NULL;

-- Success criteria:
-- 1. Foreign key constraints exist pointing to variation_options
-- 2. All variation_option_id values are either NULL or valid IDs in variation_options
-- 3. No orphaned records (variation_option_id values that don't exist in variation_options)

-- IMPORTANT: Do not run this script until the code changes are deployed!
-- This script should only be run AFTER the CartService and OrderService code changes are in production.

-- Rollback (if needed):
-- ============================================================================
-- Uncomment below to rollback to previous schema (if something goes wrong)
-- ============================================================================
/*
-- Drop new constraints
ALTER TABLE cart_items
  DROP FOREIGN KEY IF EXISTS cart_items_ibfk_3;

ALTER TABLE order_items
  DROP FOREIGN KEY IF EXISTS order_items_ibfk_3;

-- Rename columns back
ALTER TABLE cart_items
  CHANGE COLUMN variation_option_id variation_id BIGINT;

ALTER TABLE order_items
  CHANGE COLUMN variation_option_id variation_id BIGINT;

-- Restore old foreign keys
ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_ibfk_3
  FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_ibfk_3
  FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE SET NULL;
*/
