# Stock Availability Fix - Product Variations

## Problem
Product with variations showed "Out of Stock" even though individual variation options had stock available.

### Root Cause
The `product_variant_combination_options` table was empty. This table is crucial for linking variant combinations (e.g., "Red + Large") to the actual variation options they comprise.

Without these links, the frontend couldn't match user-selected variations to the corresponding variant combination stock.

## Solution

### 1. Backend Entity Fix
**File**: `backend/src/main/java/com/fascinito/pos/entity/ProductVariantCombination.java`

Changed cascade type from `CascadeType.REMOVE` to `CascadeType.ALL`:
```java
@OneToMany(
    mappedBy = "combination",
    cascade = CascadeType.ALL,  // Changed from REMOVE
    orphanRemoval = true,       // Added
    fetch = FetchType.LAZY
)
private List<ProductVariantCombinationOption> options = new ArrayList<>();
```

This ensures that when `ProductVariantCombination` entities are saved, their associated `ProductVariantCombinationOption` records are also persisted to the database.

### 2. Backend API Enhancement
Created new DTO for variant combinations:

**File**: `backend/src/main/java/com/fascinito/pos/dto/product/VariantCombinationResponse.java`
```java
@Data
@Builder
public class VariantCombinationResponse {
    private Long id;
    private BigDecimal price;
    private Integer stock;
    private Boolean active;
    private List<Long> optionIds;  // IDs of variation options
    private String combinationName; // e.g., "Red + Large"
}
```

Updated `ProductResponse` to include `variantCombinations` field and mapped the data in `ProductService.mapToResponse()`.

### 3. Database Fix Script
**File**: `FIX_VARIANT_COMBINATIONS.sql`

Created SQL script to:
1. Delete old incomplete variant combinations
2. Insert new combinations with correct stock and pricing:
   - Red + Small (stock: 3, price: 100.00)
   - Red + Large (stock: 3, price: 110.00)
   - Blue + Small (stock: 8, price: 105.00)
   - Blue + Large (stock: 8, price: 115.00)
3. Populate `product_variant_combination_options` table to link combinations with their options

### 4. Frontend Fix
**File**: `frontend/src/pages/customer/ProductDetail.tsx`

Updated variant combination matching logic to use the new API structure:
```typescript
// OLD: Looking for nested options array
const comboOptionIds = combo.options?.map((opt: any) => 
  opt.variationOption?.id || opt.variationOptionId) || []

// NEW: Using direct optionIds array from API
const comboOptionIds = combo.optionIds || []
```

## Testing
1. Visit: http://localhost:3000/products/test-with-variations
2. Select Color: Red, Size: Small → Should show "In Stock" with stock 3
3. Select Color: Blue, Size: Large → Should show "In Stock" with stock 8
4. Price should update correctly:
   - Red + Small: 100.00
   - Red + Large: 110.00 (base + 10 for Large)
   - Blue + Small: 105.00 (base + 5 for Blue)
   - Blue + Large: 115.00 (base + 5 for Blue + 10 for Large)

## Future Considerations
When creating new products with variations through the admin panel, the backend's `generateVariantCombinations()` method will now automatically populate the `product_variant_combination_options` table due to the cascade changes.

For existing products with broken variant combinations, they can be fixed by:
1. Editing the product in admin panel (triggers regeneration), OR
2. Running a similar SQL fix script, OR
3. Creating a migration script to bulk fix all affected products
