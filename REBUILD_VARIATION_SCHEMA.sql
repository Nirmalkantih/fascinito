-- ================================================================
-- PRODUCT VARIATION SYSTEM REBUILD
-- Restructured to support Variation Type -> Variation Option model
-- ================================================================

-- Step 1: Backup existing variation data (if needed)
-- Before running this script, backup your product_variations table

-- Step 2: Drop existing tables (if rebuilding)
-- WARNING: This will delete all existing variation data!
-- Only run this if you're starting fresh
/*
DROP TABLE IF EXISTS variation_options;
DROP TABLE IF EXISTS product_variations;
*/

-- Step 3: Create new product_variations table with simplified structure
-- ProductVariation = Configuration Type (e.g., Color, Size, Material)
CREATE TABLE IF NOT EXISTS product_variations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL COMMENT 'e.g., Color, Size, Material',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_product_variations_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_product_id (product_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Product variation types (Color, Size, Material, etc.)';

-- Step 4: Create variation_options table
-- VariationOption = Specific choices for a variation type
CREATE TABLE IF NOT EXISTS variation_options (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    variation_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'e.g., Red, Small, XL',
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Price adjustment for this option',
    stock_quantity INT NOT NULL DEFAULT 0 COMMENT 'Stock for this specific option',
    sku VARCHAR(100) UNIQUE COMMENT 'Unique SKU for this option',
    image_url VARCHAR(500) COMMENT 'Image for this specific option',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_variation_options_variation
        FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_variation_id (variation_id),
    INDEX idx_name (name),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Variation options - specific choices (Red, Small, etc.) for a variation type';

-- Step 5: Verify table structure
-- Run these to verify the tables were created correctly:
/*
DESCRIBE product_variations;
DESCRIBE variation_options;

-- Check relationships
SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME IN ('product_variations', 'variation_options')
AND COLUMN_NAME LIKE '%id%';
*/

-- Step 6: Example data (optional)
/*
-- Add a product (if needed)
INSERT INTO products (title, slug, regular_price, category_id, vendor_id, location_id)
VALUES ('T-Shirt', 't-shirt', 500.00, 1, 1, 1);

-- Add variation type
INSERT INTO product_variations (product_id, type)
VALUES (1, 'Color');

-- Add variation options
INSERT INTO variation_options (variation_id, name, price_adjustment, stock_quantity, sku, image_url)
VALUES
  (1, 'Red', 0, 10, 'TSHIRT-RED', '/images/red.jpg'),
  (1, 'Blue', 0, 15, 'TSHIRT-BLUE', '/images/blue.jpg'),
  (1, 'Green', 50, 5, 'TSHIRT-GREEN', '/images/green.jpg');

-- Add another variation type
INSERT INTO product_variations (product_id, type)
VALUES (1, 'Size');

-- Add size options
INSERT INTO variation_options (variation_id, name, price_adjustment, stock_quantity, sku)
VALUES
  (2, 'Small', 0, 20, 'TSHIRT-S'),
  (2, 'Medium', 0, 25, 'TSHIRT-M'),
  (2, 'Large', 0, 30, 'TSHIRT-L'),
  (2, 'XL', 100, 10, 'TSHIRT-XL');
*/

-- ================================================================
-- DATA MODEL EXPLANATION
-- ================================================================
/*
PRODUCT: Basic product info (title, price, description, etc.)
  ↓
PRODUCT_VARIATION: Configuration type (Color, Size, Material, etc.)
  ↓
VARIATION_OPTION: Specific choice (Red, Small, Cotton, etc.)

Example:
Product: T-Shirt (₹500)
  ├── Variation: Color
  │   ├── Option: Red (₹0 adjustment)
  │   ├── Option: Blue (₹0 adjustment)
  │   └── Option: Green (₹50 adjustment)
  └── Variation: Size
      ├── Option: Small (₹0 adjustment)
      ├── Option: Medium (₹0 adjustment)
      ├── Option: Large (₹0 adjustment)
      └── Option: XL (₹100 adjustment)

Each variation option can have:
- name: The specific choice value
- price_adjustment: Extra cost for this option
- stock_quantity: Stock tracking per option
- sku: Unique identifier for this option
- image_url: Specific image for this option (e.g., color swatch)
*/

-- ================================================================
-- USEFUL QUERIES
-- ================================================================
/*
-- Get all variations for a product
SELECT pv.id, pv.type, COUNT(vo.id) as option_count
FROM product_variations pv
LEFT JOIN variation_options vo ON pv.id = vo.variation_id
WHERE pv.product_id = 1
GROUP BY pv.id;

-- Get all options for a variation
SELECT * FROM variation_options
WHERE variation_id = 1
ORDER BY name;

-- Get product with all variations and options
SELECT
  p.id as product_id,
  p.title as product_name,
  pv.id as variation_id,
  pv.type as variation_type,
  vo.id as option_id,
  vo.name as option_name,
  vo.price_adjustment,
  vo.stock_quantity,
  vo.sku
FROM products p
LEFT JOIN product_variations pv ON p.id = pv.product_id
LEFT JOIN variation_options vo ON pv.id = vo.variation_id
WHERE p.id = 1
ORDER BY pv.type, vo.name;

-- Get stock availability for all options
SELECT
  vo.name,
  vo.sku,
  vo.stock_quantity,
  vo.active,
  pv.type
FROM variation_options vo
JOIN product_variations pv ON vo.variation_id = pv.id
WHERE pv.product_id = 1
AND vo.active = TRUE
ORDER BY pv.type, vo.name;
*/
