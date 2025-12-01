package com.fascinito.pos.dto.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private String sku;
    private String upc;
    
    private Long categoryId;
    private String categoryName;
    
    private Long subCategoryId;
    private String subCategoryName;
    
    private Long vendorId;
    private String vendorName;
    
    private Long locationId;
    private String locationName;
    
    private BigDecimal regularPrice;
    private BigDecimal salePrice;
    private BigDecimal costPerItem;
    private BigDecimal taxRate;
    private Boolean taxExempt;
    
    private Boolean visibleToCustomers;
    private Boolean trackInventory;
    private Integer stockQuantity;
    private Integer lowStockThreshold;
    private Boolean inStock;  // Calculated field: true if product is in stock
    
    private Boolean active;
    private Boolean featured;
    
    private List<ProductImageResponse> images;
    private List<ProductVariationResponse> variations;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
