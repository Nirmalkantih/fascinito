package com.fascinito.pos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "variation_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class VariationOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variation_id", nullable = false)
    private ProductVariation variation;

    @Column(nullable = false, length = 100)
    private String name;  // e.g., "Red", "Small", "XL"

    @Column(precision = 10, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;  // Price adjustment for this option

    @Column(nullable = false)
    private Integer stockQuantity = 0;  // Stock for this specific option

    @Column(unique = true, length = 100)
    private String sku;  // Unique SKU for this option

    @Column(length = 500)
    private String imageUrl;  // Image for this specific option

    @Column(nullable = false)
    private Boolean active = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
