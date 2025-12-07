# Stock Deduction Fix for Variation Options

## Problem Description

When customers ordered products with variations (e.g., "Kids" product with Color variations: RED and BLUE), the stock was NOT being properly deducted from the individual **variation option** stock.

### Example Scenario:
- Product: **Kids** (ID: 5)
- Variation: **Color** (ID: 7)
- Options: **RED** (ID: 48, Stock: 10), **BLUE** (ID: 49, Stock: 10)

When a customer ordered 5 BLUE items:
- ❌ Variant combination stock may or may not be set properly
- ❌ BLUE variation option stock remained at 10 (should have been 5)
- ❌ Product stock was reduced instead (wrong level)

This caused the frontend to still show BLUE as available even though it was out of stock.

## Root Causes

### Issue 1: Stock Deduction Logic
The `OrderService.deductStock()` method was only deducting stock from the `ProductVariantCombination` but not updating the underlying `VariationOption` stock quantities.

### Issue 2: Cart Service Not Finding Variant Combinations
When customers selected a single variation (e.g., only Color), the frontend sent `variationId` instead of `variantCombinationId`. The backend treated this as a simple variation option without linking it to the variant combination, resulting in:
- Cart items stored with `variation_option_id` but `variant_combination_id = NULL`
- Orders created without variant combination reference
- Stock deducted from product level instead of variation option level

## Solution

### Files Modified:
1. **`/backend/src/main/java/com/fascinito/pos/service/OrderService.java`**
2. **`/backend/src/main/java/com/fascinito/pos/service/CartService.java`**

### Changes Made:

#### 1. Enhanced `OrderService.deductStock()` method:
```java
private void deductStock(Product product, ProductVariantCombination variantCombination, 
                        VariationOption variationOption, Integer quantity) {
    if (variantCombination != null) {
        // Deduct from variant combination stock
        variantCombination.setStock(currentStock - quantity);
        
        // NEW: Also deduct from individual variation options
        for (ProductVariantCombinationOption combinationOption : variantCombination.getOptions()) {
            VariationOption option = combinationOption.getVariationOption();
            option.setStockQuantity(option.getStockQuantity() - quantity);
            variationOptionRepository.save(option);
        }
    }
    // ... rest of the logic
}
```

#### 2. Enhanced `OrderService.restoreStock()` method:
```java
private void restoreStock(Product product, ProductVariantCombination variantCombination,
                         VariationOption variationOption, Integer quantity) {
    if (variantCombination != null) {
        // Restore to variant combination stock
        variantCombination.setStock(currentStock + quantity);
        
        // NEW: Also restore to individual variation options
        for (ProductVariantCombinationOption combinationOption : variantCombination.getOptions()) {
            VariationOption option = combinationOption.getVariationOption();
            option.setStockQuantity(option.getStockQuantity() + quantity);
            variationOptionRepository.save(option);
        }
    }
    // ... rest of the logic
}
```

#### 3. Enhanced `CartService.addToCart()` method:
```java
// When variationId is provided (single variation products)
else if (request.getVariationId() != null) {
    variationOption = variationOptionRepository.findById(request.getVariationId())
            .orElseThrow(() -> new ResourceNotFoundException("Variation option not found"));
    
    // CRITICAL FIX: Try to find the variant combination for this single variation option
    List<ProductVariantCombination> combinations = variantCombinationRepository
            .findByProductIdAndVariationOptions(
                    request.getProductId(),
                    Arrays.asList(request.getVariationId()),
                    1  // Single option
            );
    
    if (!combinations.isEmpty()) {
        // Found a variant combination - use it for proper stock tracking
        variantCombination = combinations.get(0);
        existingItem = cartItemRepository.findByUserAndProductAndVariantCombination(...);
    } else {
        // Fall back to variation option (old behavior)
        existingItem = cartItemRepository.findByUserAndProductIdAndVariationOption(...);
    }
}
```

## Testing Instructions

### Prerequisites:
```bash
# Ensure backend is running with the latest changes
cd /Users/nirmal/Fascinito
docker-compose restart backend
```

### Test Case 1: Stock Deduction on Order

1. **Check Initial Stock:**
```sql
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "
SELECT vo.id, vo.name, vo.stock_quantity 
FROM variation_options vo 
WHERE vo.variation_id = 7;
"
```
Expected: RED: 10, BLUE: 10

2. **Place an Order:**
   - Log in to customer portal: http://localhost:5173
   - Add "Kids" product with RED color (quantity: 5) to cart
   - Checkout and complete the order

3. **Verify Stock After Order:**
```sql
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "
SELECT vo.id, vo.name, vo.stock_quantity 
FROM variation_options vo 
WHERE vo.variation_id = 7;
"
```
Expected: RED: 5, BLUE: 10

4. **Check Variant Combination Stock:**
```sql
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "
SELECT pvc.id, pvc.stock, vo.name 
FROM product_variant_combination pvc 
JOIN product_variant_combination_options pvco ON pvc.id = pvco.combination_id 
JOIN variation_options vo ON pvco.variation_option_id = vo.id 
WHERE pvc.product_id = 5 AND vo.name = 'RED';
"
```
Expected: Stock should also be reduced

### Test Case 2: Stock Restoration on Order Cancellation

1. **Cancel the Order:**
   - In admin panel, cancel the order you just placed
   - OR use API: `DELETE /api/orders/{orderId}`

2. **Verify Stock Restored:**
```sql
docker exec pos-mysql mysql -upos_user -ppos_password pos_db -e "
SELECT vo.id, vo.name, vo.stock_quantity 
FROM variation_options vo 
WHERE vo.variation_id = 7;
"
```
Expected: RED: 10, BLUE: 10 (back to original)

### Test Case 3: Frontend Availability Check

1. **Deplete RED Stock:**
   - Place orders until RED variant combination stock = 0

2. **Check Product Detail Page:**
   - Visit: http://localhost:5173/products/5
   - RED option should show as unavailable (with ✕ indicator)
   - BLUE option should still be selectable

3. **Try to Add RED to Cart:**
   - Should show error: "Product is out of stock" or "Insufficient stock"

## Database Schema Reference

### Tables Involved:
1. **`products`** - Base product info
2. **`product_variations`** - Variation types (e.g., Color, Size)
3. **`variation_options`** - Specific options (e.g., RED, BLUE)
   - `stock_quantity` - NOW BEING UPDATED ✅
4. **`product_variant_combination`** - Combinations of options
   - `stock` - Already being updated ✅
5. **`product_variant_combination_options`** - Links combinations to options

### Stock Flow:
```
Order Placed → 
  1. Deduct from variant_combination.stock
  2. Deduct from each variation_option.stock_quantity (in the combination)
  
Order Cancelled → 
  1. Restore to variant_combination.stock
  2. Restore to each variation_option.stock_quantity (in the combination)
```

## Logs to Monitor

After placing an order, check backend logs:
```bash
docker logs pos-backend --tail 50 | grep -i "deducted\|restored"
```

Expected log entries:
```
Deducted 5 units from variant combination 46 stock. New stock: 0
Deducted 5 units from variation option 49 (BLUE) stock. New stock: 5
```

## Impact

### Before Fix:
- ❌ Variation option stock never reduced
- ❌ Frontend showed items as available when actually out of stock
- ❌ Customers could order out-of-stock items

### After Fix:
- ✅ Both variant combination and variation option stocks are reduced
- ✅ Frontend correctly shows out-of-stock status
- ✅ Prevents ordering unavailable items
- ✅ Stock restoration works correctly on cancellation

## Additional Notes

- This fix applies to products with variations that use variant combinations
- Products without variations or with single variation options are not affected
- The fix is backward compatible and doesn't require database migration
- Existing orders are not affected, only new orders will have proper stock deduction
