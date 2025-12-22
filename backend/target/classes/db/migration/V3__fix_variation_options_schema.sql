-- Fix schema mismatches between entity definitions and init SQL script

-- 1. Fix banners table: rename 'active' column to 'is_active' or vice versa
-- The entity expects 'is_active' but init SQL creates 'active'
ALTER TABLE IF EXISTS banners
DROP COLUMN IF EXISTS active CASCADE;

-- Make sure is_active column exists
ALTER TABLE IF EXISTS banners
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Fix variation_options table: remove 'value' column and ensure 'name' column exists
-- The entity uses 'name' not 'value'
ALTER TABLE IF EXISTS variation_options
DROP COLUMN IF EXISTS value CASCADE;

-- Ensure 'name' column exists and is NOT NULL
ALTER TABLE IF EXISTS variation_options
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

ALTER TABLE IF EXISTS variation_options
ALTER COLUMN name SET NOT NULL;
