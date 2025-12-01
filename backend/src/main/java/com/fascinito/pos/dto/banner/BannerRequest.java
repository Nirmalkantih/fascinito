package com.fascinito.pos.dto.banner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerRequest {

    @NotBlank(message = "Banner title is required")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    @Size(max = 500, message = "Subtitle must not exceed 500 characters")
    private String subtitle;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String backgroundColor;

    private String textColor;

    private String ctaUrl;

    private Integer displayOrder;

    private Boolean active = true;
}
