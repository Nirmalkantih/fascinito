package com.fascinito.pos.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
@Data
public class AppConfig {

    private MailConfig mail;
    private InvoiceConfig invoice;

    @Data
    public static class MailConfig {
        private String from;
        private String admin;
    }

    @Data
    public static class InvoiceConfig {
        private String uploadPath;
        private String baseUrl;
    }
}
