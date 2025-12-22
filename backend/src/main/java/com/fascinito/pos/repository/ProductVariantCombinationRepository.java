package com.fascinito.pos.repository;

import com.fascinito.pos.entity.ProductVariantCombination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantCombinationRepository extends JpaRepository<ProductVariantCombination, Long> {

    /**
     * Find all combinations for a specific product
     */
    List<ProductVariantCombination> findByProductId(Long productId);

    /**
     * Find all active combinations for a specific product
     */
    List<ProductVariantCombination> findByProductIdAndActiveTrue(Long productId);

    /**
     * Find a combination by product and specific variation option IDs
     * The combination must have ALL the specified options and no extra ones
     */
    @Query("""
        SELECT pvc FROM ProductVariantCombination pvc
        WHERE pvc.product.id = :productId
        AND pvc.id IN (
            SELECT DISTINCT pvco.combination.id
            FROM ProductVariantCombinationOption pvco
            WHERE pvco.variationOption.id IN :variationOptionIds
            GROUP BY pvco.combination.id
            HAVING COUNT(*) = :optionCount
        )
    """)
    List<ProductVariantCombination> findByProductIdAndVariationOptions(
        @Param("productId") Long productId,
        @Param("variationOptionIds") List<Long> variationOptionIds,
        @Param("optionCount") int optionCount
    );

    /**
     * Delete all combinations for a product
     */
    @Modifying
    @Query("DELETE FROM ProductVariantCombination pvc WHERE pvc.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    /**
     * Deactivate all combinations for a product (safer than deletion when referenced by orders)
     */
    @Modifying
    @Query("UPDATE ProductVariantCombination pvc SET pvc.active = false WHERE pvc.product.id = :productId")
    void deactivateByProductId(@Param("productId") Long productId);
}
