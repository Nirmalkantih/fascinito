package com.fascinito.pos.repository;

import com.fascinito.pos.entity.EmailCampaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {

    Page<EmailCampaign> findByCreatedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<EmailCampaign> findByStatusOrderByCreatedAtDesc(EmailCampaign.CampaignStatus status, Pageable pageable);

    @Query("SELECT c FROM EmailCampaign c WHERE c.status = 'SCHEDULED' AND c.scheduledAt <= :now")
    List<EmailCampaign> findScheduledCampaignsToSend(@Param("now") LocalDateTime now);

    @Query("SELECT c FROM EmailCampaign c WHERE c.status = 'SENDING' OR c.status = 'SCHEDULED'")
    List<EmailCampaign> findActiveCampaigns();

    @Query("SELECT COUNT(c) FROM EmailCampaign c WHERE c.createdBy.id = :userId")
    Long countByCreatedById(@Param("userId") Long userId);

    @Query("SELECT COUNT(c) FROM EmailCampaign c WHERE c.status = :status")
    Long countByStatus(@Param("status") EmailCampaign.CampaignStatus status);
}
