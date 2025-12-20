package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.images WHERE p.slug = :slug")
    Optional<Product> findBySlug(@Param("slug") String slug);

    Boolean existsBySlug(String slug);

    Boolean existsBySku(String sku);

    // OPTIMIZED: With lazy-loading for relationship collections
    // Images will be batch-fetched using @BatchSize(size=10) annotation
    @Query("SELECT p FROM Product p WHERE p.visibleToCustomers = true ORDER BY p.id")
    Page<Product> findByVisibleToCustomersTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.visibleToCustomers = true AND p.active = true ORDER BY p.id")
    Page<Product> findByVisibleToCustomersTrueAndActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.visibleToCustomers = true AND p.active = true ORDER BY p.id")
    Page<Product> findByCategoryIdAndVisibleToCustomersTrueAndActiveTrue(
            @Param("categoryId") Long categoryId,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.vendor.id = :vendorId AND p.visibleToCustomers = true AND p.active = true ORDER BY p.id")
    Page<Product> findByVendorIdAndVisibleToCustomersTrueAndActiveTrue(
            @Param("vendorId") Long vendorId,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.featured = true AND p.visibleToCustomers = true AND p.active = true ORDER BY p.id DESC")
    Page<Product> findByFeaturedTrueAndVisibleToCustomersTrueAndActiveTrue(Pageable pageable);

    Long countByCategoryId(Long categoryId);

    Long countByVendorId(Long vendorId);

    Long countByLocationId(Long locationId);

    @Query("SELECT COALESCE(SUM(p.stockQuantity), 0) FROM Product p WHERE p.category.id = :categoryId AND p.visibleToCustomers = true AND p.active = true")
    Integer getTotalStockByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id IN :productIds ORDER BY p.id")
    List<Product> findByIdsWithImages(@Param("productIds") List<Long> productIds);

    // Additional optimized queries for common use cases
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithDetails(@Param("id") Long id);
}
