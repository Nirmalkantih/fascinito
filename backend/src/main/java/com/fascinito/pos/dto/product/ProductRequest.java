package com.fascinito.pos.dto.product;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 300, message = "Title must not exceed 300 characters")
    private String title;

    @NotBlank(message = "Slug is required")
    @Size(max = 400, message = "Slug must not exceed 400 characters")
    private String slug;

    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @Size(max = 100, message = "SKU must not exceed 100 characters")
    private String sku;

    @Size(max = 100, message = "UPC must not exceed 100 characters")
    private String upc;

    private Long categoryId;

    private Long subCategoryId;

    private Long vendorId;

    private Long locationId;

    @NotNull(message = "Regular price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Regular price must be greater than 0")
    private BigDecimal regularPrice;

    @DecimalMin(value = "0.0", inclusive = false, message = "Sale price must be greater than 0")
    private BigDecimal salePrice;

    @DecimalMin(value = "0.0", message = "Cost per item must be 0 or greater")
    private BigDecimal costPerItem;

    @DecimalMin(value = "0.0", message = "Tax rate must be 0 or greater")
    @DecimalMax(value = "100.0", message = "Tax rate must not exceed 100")
    private BigDecimal taxRate = BigDecimal.ZERO;

    private Boolean taxExempt = false;

    private Boolean visibleToCustomers = true;

    private Boolean trackInventory = false;

    @Min(value = 0, message = "Stock quantity must be 0 or greater")
    private Integer stockQuantity = 0;

    @Min(value = 0, message = "Low stock threshold must be 0 or greater")
    private Integer lowStockThreshold = 5;

    private Boolean active = true;

    private Boolean featured = false;

    private List<String> imageUrls;

    private List<ProductVariationRequest> variations;
}
