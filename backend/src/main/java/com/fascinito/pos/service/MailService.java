package com.fascinito.pos.service;

import com.fascinito.pos.entity.EmailTemplate;
import com.fascinito.pos.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Optional;

@Service
@Slf4j
public class MailService {
    private final Optional<JavaMailSender> javaMailSender;
    private final EmailTemplateService emailTemplateService;

    @Value("${spring.mail.from:noreply@fascinito.com}")
    private String fromEmail;

    @Autowired
    public MailService(Optional<JavaMailSender> javaMailSender, EmailTemplateService emailTemplateService) {
        this.javaMailSender = javaMailSender;
        this.emailTemplateService = emailTemplateService;
        log.info("MailService initialized with JavaMailSender. Mail configured: {}", javaMailSender.isPresent());
    }

    /**
     * Send email based on template and order status change
     */
    public void sendOrderStatusEmail(Order order, EmailTemplate template) {
        if (javaMailSender.isEmpty()) {
            log.warn("Mail service not configured. Skipping email for order {}", order.getOrderNumber());
            return;
        }

        try {
            String processedSubject = emailTemplateService.processTemplate(template.getSubject(), order);
            String processedBody = emailTemplateService.processTemplate(template.getBodyHtml(), order);

            sendHtmlEmail(
                    order.getUser().getEmail(),
                    processedSubject,
                    processedBody
            );

            log.info("Email sent to {} for order {} with template {}",
                    order.getUser().getEmail(), order.getOrderNumber(), template.getTemplateKey());
        } catch (Exception e) {
            log.error("Failed to send email for order {}: {}", order.getOrderNumber(), e.getMessage(), e);
        }
    }

    /**
     * Send HTML email
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        if (javaMailSender.isEmpty()) {
            log.warn("Mail service not configured. Skipping email to {}", to);
            return;
        }

        MimeMessage mimeMessage = javaMailSender.get().createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        javaMailSender.get().send(mimeMessage);
    }

    /**
     * Send plain text email
     */
    public void sendEmail(String to, String subject, String text) {
        if (javaMailSender.isEmpty()) {
            log.warn("Mail service not configured. Skipping email to {}", to);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        javaMailSender.get().send(message);
    }

    /**
     * Send test email with template preview
     */
    public void sendTestEmail(String to, EmailTemplate template, Order order) {
        if (javaMailSender.isEmpty()) {
            log.warn("Mail service not configured. Cannot send test email to {}", to);
            throw new RuntimeException("Mail service not configured. Please configure SMTP settings.");
        }

        try {
            String processedSubject = emailTemplateService.processTemplate(template.getSubject(), order);
            String processedBody = emailTemplateService.processTemplate(template.getBodyHtml(), order);

            MimeMessage mimeMessage = javaMailSender.get().createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("[TEST] " + processedSubject);
            helper.setText(processedBody, true);

            javaMailSender.get().send(mimeMessage);
            log.info("Test email sent to {} for template {}", to, template.getTemplateKey());
        } catch (Exception e) {
            log.error("Failed to send test email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send test email: " + e.getMessage(), e);
        }
    }
}
