package com.fascinito.pos.repository;

import com.fascinito.pos.entity.EmailCampaignRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailCampaignRecipientRepository extends JpaRepository<EmailCampaignRecipient, Long> {

    Page<EmailCampaignRecipient> findByCampaignId(Long campaignId, Pageable pageable);

    Page<EmailCampaignRecipient> findByCampaignIdAndStatus(Long campaignId, EmailCampaignRecipient.RecipientStatus status, Pageable pageable);

    List<EmailCampaignRecipient> findByCampaignIdAndStatus(Long campaignId, EmailCampaignRecipient.RecipientStatus status);

    Optional<EmailCampaignRecipient> findByCampaignIdAndCustomerId(Long campaignId, Long customerId);

    @Query("SELECT COUNT(r) FROM EmailCampaignRecipient r WHERE r.campaign.id = :campaignId AND r.status = 'SENT'")
    Integer countSentByCampaignId(@Param("campaignId") Long campaignId);

    @Query("SELECT COUNT(r) FROM EmailCampaignRecipient r WHERE r.campaign.id = :campaignId AND r.status = 'FAILED'")
    Integer countFailedByCampaignId(@Param("campaignId") Long campaignId);

    @Query("SELECT COUNT(r) FROM EmailCampaignRecipient r WHERE r.campaign.id = :campaignId AND r.status = 'PENDING'")
    Integer countPendingByCampaignId(@Param("campaignId") Long campaignId);

    @Query("SELECT r FROM EmailCampaignRecipient r WHERE r.campaign.id = :campaignId AND r.status = 'PENDING' ORDER BY r.createdAt ASC")
    List<EmailCampaignRecipient> findPendingRecipientsByOrder(@Param("campaignId") Long campaignId);
}
