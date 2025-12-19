package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.entity.CancellationReason;
import com.fascinito.pos.repository.CancellationReasonRepository;
import com.fascinito.pos.dto.order.CancellationReasonResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/cancellation-reasons")
@RequiredArgsConstructor
@Slf4j
public class CancellationReasonController {

    private final CancellationReasonRepository cancellationReasonRepository;

    /**
     * Get all active cancellation reasons
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CancellationReasonResponse>>> getCancellationReasons() {
        log.info("Fetching all active cancellation reasons");

        List<CancellationReasonResponse> reasons = cancellationReasonRepository.findByActiveTrueOrderByDisplayOrder()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.<List<CancellationReasonResponse>>builder()
                .success(true)
                .message("Cancellation reasons retrieved successfully")
                .data(reasons)
                .build());
    }

    private CancellationReasonResponse mapToResponse(CancellationReason reason) {
        return CancellationReasonResponse.builder()
                .id(reason.getId())
                .reasonKey(reason.getReasonKey())
                .reasonText(reason.getReasonText())
                .displayOrder(reason.getDisplayOrder())
                .build();
    }
}
