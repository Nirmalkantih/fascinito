package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    
    Optional<Product> findBySlug(String slug);
    
    Boolean existsBySlug(String slug);
    
    Boolean existsBySku(String sku);
    
    Page<Product> findByVisibleToCustomersTrue(Pageable pageable);
    
    Page<Product> findByVisibleToCustomersTrueAndActiveTrue(Pageable pageable);
    
    Page<Product> findByCategoryIdAndVisibleToCustomersTrueAndActiveTrue(Long categoryId, Pageable pageable);
    
    Page<Product> findByVendorIdAndVisibleToCustomersTrueAndActiveTrue(Long vendorId, Pageable pageable);

    Page<Product> findByFeaturedTrueAndVisibleToCustomersTrueAndActiveTrue(Pageable pageable);

    Long countByCategoryId(Long categoryId);

    Long countByVendorId(Long vendorId);

    Long countByLocationId(Long locationId);

    @Query("SELECT COALESCE(SUM(p.stockQuantity), 0) FROM Product p WHERE p.category.id = :categoryId AND p.visibleToCustomers = true AND p.active = true")
    Integer getTotalStockByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id IN :productIds")
    java.util.List<Product> findByIdsWithImages(@Param("productIds") java.util.List<Long> productIds);
}
