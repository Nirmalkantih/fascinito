package com.fascinito.pos.dto.banner;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerResponse {

    private Long id;

    private String title;

    private String subtitle;

    private String imageUrl;

    private String backgroundColor;

    private String textColor;

    private String ctaUrl;

    private Integer displayOrder;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
