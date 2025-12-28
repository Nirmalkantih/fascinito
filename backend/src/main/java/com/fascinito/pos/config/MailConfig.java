package com.fascinito.pos.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;

import java.util.Properties;

@Configuration
@Slf4j
public class MailConfig {

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${spring.mail.port:}")
    private String portStr;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Bean
    public JavaMailSender javaMailSender() {
        // Only create bean if mail host is configured
        if (host == null || host.isEmpty()) {
            log.info("Mail host not configured, skipping JavaMailSender bean creation");
            return null;
        }

        try {
            int port = Integer.parseInt(portStr);
            log.info("Initializing JavaMailSender with host: {}, port: {}, username: {}", host, port, username);

            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost(host);
            mailSender.setPort(port);
            mailSender.setUsername(username);
            mailSender.setPassword(password);

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.socketFactory.port", port);
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
            props.put("mail.smtp.starttls.enable", "false");

            log.info("JavaMailSender configured successfully for: {}", host);
            return mailSender;
        } catch (NumberFormatException e) {
            log.warn("Invalid mail port configuration: {}", portStr);
            return null;
        }
    }
}
