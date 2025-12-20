package com.fascinito.pos.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancellationReasonResponse {
    private Long id;
    private String reasonKey;
    private String reasonText;
    private Integer displayOrder;
}
