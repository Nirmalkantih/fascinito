-- Add variant_combination_id column to cart_items table
-- This allows cart items to reference ProductVariantCombination for products with multiple variations

ALTER TABLE cart_items
ADD COLUMN variant_combination_id BIGINT NULL AFTER variation_option_id;

-- Add foreign key constraint
ALTER TABLE cart_items
ADD CONSTRAINT fk_cart_items_variant_combination
FOREIGN KEY (variant_combination_id) REFERENCES product_variant_combination(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_cart_items_variant_combination ON cart_items(variant_combination_id);

-- Note: The variation_option_id column is kept for backward compatibility
-- New cart items should use variant_combination_id for products with multiple variations
