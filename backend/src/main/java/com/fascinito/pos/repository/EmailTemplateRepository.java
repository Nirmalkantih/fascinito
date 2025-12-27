package com.fascinito.pos.repository;

import com.fascinito.pos.entity.EmailTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {
    Optional<EmailTemplate> findByTemplateKey(String templateKey);

    Page<EmailTemplate> findByIsActiveTrue(Pageable pageable);

    Page<EmailTemplate> findAll(Pageable pageable);

    boolean existsByTemplateKey(String templateKey);
}
