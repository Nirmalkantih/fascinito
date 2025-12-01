package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long>, JpaSpecificationExecutor<Vendor> {
    
    Optional<Vendor> findBySlug(String slug);
    
    List<Vendor> findByActiveTrue();
    
    Page<Vendor> findByActiveTrue(Pageable pageable);
}
