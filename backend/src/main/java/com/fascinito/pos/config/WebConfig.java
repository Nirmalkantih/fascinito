package com.fascinito.pos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

import java.util.concurrent.TimeUnit;

/**
 * Web configuration for caching and performance optimization
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Configure resource handlers for static resources and API responses
     * This enables HTTP caching for images and other static content
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded files from uploads directory
        // Use absolute path for Docker compatibility
        String uploadBasePath = System.getenv("UPLOAD_BASE_PATH") != null
                ? System.getenv("UPLOAD_BASE_PATH")
                : "uploads";
        String uploadFileLocation = "file:" + uploadBasePath + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadFileLocation)
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .resourceChain(true);

        // Cache images for 30 days (maximum browser cache)
        registry.addResourceHandler("/images/**")
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .resourceChain(true);

        // Cache static files (CSS, JS) for 7 days
        registry.addResourceHandler("/static/**")
                .setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                .resourceChain(true);

        // Cache product images with ETag support for 30 days
        registry.addResourceHandler("/products/images/**")
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .resourceChain(true)
                .addResolver(new org.springframework.web.servlet.resource.VersionResourceResolver()
                        .addFixedVersionStrategy("prod", "/**"));
    }
}
