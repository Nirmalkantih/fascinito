package com.fascinito.pos.repository;

import com.fascinito.pos.entity.VariationOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VariationOptionRepository extends JpaRepository<VariationOption, Long> {
    List<VariationOption> findByVariationId(Long variationId);
    void deleteByVariationId(Long variationId);
}
