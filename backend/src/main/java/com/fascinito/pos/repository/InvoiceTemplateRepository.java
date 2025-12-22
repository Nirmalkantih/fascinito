package com.fascinito.pos.repository;

import com.fascinito.pos.entity.InvoiceTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceTemplateRepository extends JpaRepository<InvoiceTemplate, Long> {

    Optional<InvoiceTemplate> findByTemplateId(String templateId);

    boolean existsByTemplateId(String templateId);

    @Query("SELECT t FROM InvoiceTemplate t WHERE t.active = true AND t.templateType = :templateType ORDER BY t.createdAt DESC")
    Optional<InvoiceTemplate> findActiveByType(@Param("templateType") InvoiceTemplate.TemplateType templateType);

    @Query("SELECT t FROM InvoiceTemplate t WHERE t.active = true ORDER BY t.createdAt DESC")
    List<InvoiceTemplate> findAllActive();

    Page<InvoiceTemplate> findByActive(Boolean active, Pageable pageable);

    @Query("SELECT t FROM InvoiceTemplate t WHERE (:search IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY t.createdAt DESC")
    Page<InvoiceTemplate> search(@Param("search") String search, Pageable pageable);
}
