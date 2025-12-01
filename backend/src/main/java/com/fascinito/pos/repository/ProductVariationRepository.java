package com.fascinito.pos.repository;

import com.fascinito.pos.entity.ProductVariation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariationRepository extends JpaRepository<ProductVariation, Long> {
    
    List<ProductVariation> findByProductIdAndActiveTrue(Long productId);
}
