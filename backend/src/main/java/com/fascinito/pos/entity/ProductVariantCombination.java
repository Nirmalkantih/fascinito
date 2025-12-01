package com.fascinito.pos.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variant_combination")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantCombination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @OneToMany(
        mappedBy = "combination",
        cascade = CascadeType.REMOVE,
        fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<ProductVariantCombinationOption> options = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Add a combination option to this combination
     */
    public void addOption(VariationOption variationOption) {
        ProductVariantCombinationOption option = ProductVariantCombinationOption.builder()
            .combination(this)
            .variationOption(variationOption)
            .build();
        options.add(option);
    }

    /**
     * Get a readable name for this combination (e.g., "Red + Large + Cotton")
     */
    public String getCombinationName() {
        return options.stream()
            .map(opt -> opt.getVariationOption().getName())
            .reduce((a, b) -> a + " + " + b)
            .orElse("Unknown");
    }

}
