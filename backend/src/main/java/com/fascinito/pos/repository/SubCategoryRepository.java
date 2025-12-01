package com.fascinito.pos.repository;

import com.fascinito.pos.entity.SubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {
    
    Optional<SubCategory> findBySlug(String slug);
    
    List<SubCategory> findByCategoryIdAndActiveTrueOrderByDisplayOrderAsc(Long categoryId);
}
