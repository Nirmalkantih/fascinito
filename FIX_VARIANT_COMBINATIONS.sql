-- Fix variant combinations for product ID 2
-- This script will regenerate variant combinations with proper links to variation options

-- Step 1: Clean up existing combinations (already done, but keeping for completeness)
DELETE FROM product_variant_combination_options 
WHERE combination_id IN (SELECT id FROM product_variant_combination WHERE product_id = 2);

DELETE FROM product_variant_combination WHERE product_id = 2;

-- Step 2: Insert variant combinations with stock and price
-- Red + Small (stock: min(3,20)=3, price: 100+0+0=100)
INSERT INTO product_variant_combination (product_id, price, stock, active, created_at, updated_at, version)
VALUES (2, 100.00, 3, 1, NOW(), NOW(), 0);
SET @comb_id_1 = LAST_INSERT_ID();

-- Red + Large (stock: min(3,8)=3, price: 100+0+10=110)
INSERT INTO product_variant_combination (product_id, price, stock, active, created_at, updated_at, version)
VALUES (2, 110.00, 3, 1, NOW(), NOW(), 0);
SET @comb_id_2 = LAST_INSERT_ID();

-- Blue + Small (stock: min(8,20)=8, price: 100+5+0=105)
INSERT INTO product_variant_combination (product_id, price, stock, active, created_at, updated_at, version)
VALUES (2, 105.00, 8, 1, NOW(), NOW(), 0);
SET @comb_id_3 = LAST_INSERT_ID();

-- Blue + Large (stock: min(8,8)=8, price: 100+5+10=115)
INSERT INTO product_variant_combination (product_id, price, stock, active, created_at, updated_at, version)
VALUES (2, 115.00, 8, 1, NOW(), NOW(), 0);
SET @comb_id_4 = LAST_INSERT_ID();

-- Step 3: Link combinations to their variation options
-- Red + Small
INSERT INTO product_variant_combination_options (combination_id, variation_option_id, created_at)
VALUES (@comb_id_1, 30, NOW()), (@comb_id_1, 32, NOW());

-- Red + Large
INSERT INTO product_variant_combination_options (combination_id, variation_option_id, created_at)
VALUES (@comb_id_2, 30, NOW()), (@comb_id_2, 33, NOW());

-- Blue + Small
INSERT INTO product_variant_combination_options (combination_id, variation_option_id, created_at)
VALUES (@comb_id_3, 31, NOW()), (@comb_id_3, 32, NOW());

-- Blue + Large
INSERT INTO product_variant_combination_options (combination_id, variation_option_id, created_at)
VALUES (@comb_id_4, 31, NOW()), (@comb_id_4, 33, NOW());

-- Verification queries
SELECT 'Variant Combinations Created:' as Result;
SELECT id, product_id, price, stock, active FROM product_variant_combination WHERE product_id = 2;

SELECT 'Combination Options Created:' as Result;
SELECT 
    pvc.id as combination_id,
    GROUP_CONCAT(vo.name ORDER BY vo.id SEPARATOR ' + ') as combination_name,
    pvc.price,
    pvc.stock
FROM product_variant_combination pvc
JOIN product_variant_combination_options pvco ON pvc.id = pvco.combination_id
JOIN variation_options vo ON pvco.variation_option_id = vo.id
WHERE pvc.product_id = 2
GROUP BY pvc.id, pvc.price, pvc.stock;
