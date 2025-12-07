# Testing the Stock Deduction Fix

## Database Cleanup Performed

✅ **Deleted test orders** for Product ID 5 (Kids)  
✅ **Reset stock levels:**
- Product stock: 20 units
- RED option: 10 units
- BLUE option: 10 units
- Variant combinations: 10 units each

✅ **Removed duplicate variant combinations**  
- Kept only 2 combinations: RED (ID: 45) and BLUE (ID: 46)

## Current Database State

```sql
Product "Kids" (ID: 5):
- Total Stock: 20
- Variation: Color (ID: 7)
  - RED (ID: 48): 10 units
  - BLUE (ID: 49): 10 units
- Variant Combinations:
  - Combination 45 (RED): 10 units
  - Combination 46 (BLUE): 10 units
```

## How to Test the Fix

### Step 1: Clear Browser Cache & Login
```bash
# Clear your browser cache or use incognito mode
# Login to: http://localhost:5173
```

### Step 2: Add RED Item to Cart
1. Navigate to the "Kids" product
2. Select **RED** color
3. Add **3 units** to cart
4. Go to cart and verify the items

### Step 3: Place Order
1. Proceed to checkout
2. Complete the order
3. **Expected behavior:**
   - Order should be created successfully
   - You should see confirmation

### Step 4: Verify Stock Deduction

Run this SQL query:
```bash
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "
SELECT 'Product Stock' as Type, stock_quantity FROM products WHERE id = 5;
SELECT 'RED Option' as Type, stock_quantity FROM variation_options WHERE id = 48;
SELECT 'BLUE Option' as Type, stock_quantity FROM variation_options WHERE id = 49;
SELECT 'RED Combination' as Type, stock FROM product_variant_combination WHERE id = 45;
SELECT 'BLUE Combination' as Type, stock FROM product_variant_combination WHERE id = 46;
"
```

**Expected Results After Ordering 3 RED Items:**
- Product Stock: 17 (was 20)
- RED Option: 7 (was 10) ✅ **This should now work!**
- BLUE Option: 10 (unchanged)
- RED Combination: 7 (was 10)
- BLUE Combination: 10 (unchanged)

### Step 5: Check Backend Logs

```bash
docker logs pos-backend --tail 50 2>&1 | grep -i "deducted"
```

**Expected Logs:**
```
Deducted 3 units from variant combination 45 stock. New stock: 7
Deducted 3 units from variation option 48 (RED) stock. New stock: 7
```

### Step 6: Test Frontend Availability

1. Go back to the Kids product page
2. **RED should show 7 units available**
3. **BLUE should show 10 units available**
4. Try to order 10 RED units (should fail with "insufficient stock")

### Step 7: Test with BLUE

1. Add 5 BLUE items to cart
2. Place order
3. Verify:
   - BLUE Option: 5 (was 10)
   - RED Option: 7 (unchanged from previous test)

## Check Cart Items Table

To see how cart items are being stored:
```bash
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "
SELECT ci.id, ci.product_id, ci.variation_option_id, ci.variant_combination_id, ci.quantity, vo.name
FROM cart_items ci
LEFT JOIN variation_options vo ON ci.variation_option_id = vo.id
WHERE ci.product_id = 5;
"
```

**Expected:** `variant_combination_id` should now be populated (45 for RED, 46 for BLUE)

## Check Order Items Table

After placing an order:
```bash
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "
SELECT oi.id, oi.product_id, oi.variation_option_id, oi.variant_combination_id, oi.quantity, o.order_number
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.product_id = 5
ORDER BY oi.created_at DESC
LIMIT 5;
"
```

**Expected:** `variant_combination_id` should be populated (not NULL)

## If Issues Persist

### Check if Cart Item Has Variant Combination

If the order still has NULL variant_combination_id, it means:
1. The cart item was added BEFORE the backend fix
2. Need to clear cart and add fresh items

**Clear cart:**
```bash
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "DELETE FROM cart_items WHERE user_id = YOUR_USER_ID;"
```

### Check Backend Logs for Errors

```bash
docker logs pos-backend --tail 100 2>&1 | grep -i "error"
```

### Verify Backend is Running Latest Code

```bash
docker exec pos-backend sh -c "ls -la /app/app.jar && date"
```

The JAR file should be dated after the fix was applied (2025-12-06 12:29:00 IST or later).

## Success Criteria

✅ **Cart items have `variant_combination_id` populated**  
✅ **Orders have `variant_combination_id` populated**  
✅ **Variation option stock reduces when orders are placed**  
✅ **Variant combination stock reduces when orders are placed**  
✅ **Frontend shows correct availability**  
✅ **Cannot order more than available stock**  
✅ **Stock is restored when orders are cancelled**

## Rollback Plan

If you need to rollback:
```bash
# Restore previous backend JAR
# Delete new orders
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "
DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE created_at > '2025-12-06 12:29:00');
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE created_at > '2025-12-06 12:29:00');
DELETE FROM orders WHERE created_at > '2025-12-06 12:29:00';
"
```
