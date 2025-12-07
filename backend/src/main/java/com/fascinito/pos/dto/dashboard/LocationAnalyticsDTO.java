package com.fascinito.pos.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationAnalyticsDTO {
    private String name;
    private Double revenue;
    private Double profit;
    private Double spending;
}
