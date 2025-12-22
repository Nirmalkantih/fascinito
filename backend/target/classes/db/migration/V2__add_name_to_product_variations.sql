-- Add 'name' column to product_variations table
-- This column represents the specific value (e.g., 'Red', 'Large', 'Cotton')
-- while 'type' represents the category (e.g., 'Color', 'Size', 'Material')

ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- For existing records, set name to type temporarily
-- This ensures backward compatibility
UPDATE product_variations
SET name = type
WHERE name IS NULL;

-- Now make the column NOT NULL
ALTER TABLE product_variations
ALTER COLUMN name SET NOT NULL;
