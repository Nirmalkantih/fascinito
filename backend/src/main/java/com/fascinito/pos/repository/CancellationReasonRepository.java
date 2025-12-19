package com.fascinito.pos.repository;

import com.fascinito.pos.entity.CancellationReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CancellationReasonRepository extends JpaRepository<CancellationReason, Long> {

    Optional<CancellationReason> findByReasonKey(String reasonKey);

    List<CancellationReason> findByActiveTrueOrderByDisplayOrder();
}
