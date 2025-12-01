package com.fascinito.pos.dto.category;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private Boolean active;
    private Integer productCount;
    private Integer totalStockCount;  // Total stock quantity of all products in this category
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
