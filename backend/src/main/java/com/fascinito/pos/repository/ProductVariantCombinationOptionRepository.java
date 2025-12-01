package com.fascinito.pos.repository;

import com.fascinito.pos.entity.ProductVariantCombinationOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantCombinationOptionRepository extends JpaRepository<ProductVariantCombinationOption, Long> {

    /**
     * Find all options for a specific combination
     */
    List<ProductVariantCombinationOption> findByCombinationId(Long combinationId);

    /**
     * Delete all options for a combination
     */
    void deleteByCombinationId(Long combinationId);
}
