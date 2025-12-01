package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Banner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {

    /**
     * Find all active banners ordered by display order
     */
    List<Banner> findByActiveTrueOrderByDisplayOrder();

    /**
     * Find all banners with pagination
     */
    Page<Banner> findAll(Pageable pageable);
}
