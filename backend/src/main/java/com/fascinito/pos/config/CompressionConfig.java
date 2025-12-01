package com.fascinito.pos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;

/**
 * Configuration for HTTP compression to optimize response sizes
 * Enables GZIP compression for API responses and images
 */
@Configuration
public class CompressionConfig implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {

    @Override
    public void customize(ConfigurableWebServerFactory factory) {
        // Enable Gzip compression
        // Note: Compression is configured via application.yml properties
        // server.compression.enabled=true
        // server.compression.min-response-size=1024
        // server.compression.compressed-mime-types=...
    }
}
