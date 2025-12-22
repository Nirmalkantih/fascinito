package com.fascinito.pos.service;

import com.fascinito.pos.config.AppConfig;
import com.fascinito.pos.entity.EmailLog;
import com.fascinito.pos.entity.Invoice;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.repository.EmailLogRepository;
import com.fascinito.pos.repository.InvoiceRepository;
import com.fascinito.pos.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final EmailLogRepository emailLogRepository;
    private final AppConfig appConfig;

    @Async("taskExecutor")
    @Transactional
    public void sendInvoiceEmail(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId).orElse(null);
        if (invoice == null) {
            log.warn("Invoice not found for id: {}", invoiceId);
            return;
        }

        Order order = invoice.getOrder();
        String recipientEmail = order.getUser().getEmail();

        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Customer email not found for order: {}", order.getOrderNumber());
            logEmail(EmailLog.EmailType.INVOICE, recipientEmail, "Invoice Email", false, "Customer email not available", order.getId(), invoiceId);
            return;
        }

        try {
            // Read PDF file
            byte[] pdfBytes = Files.readAllBytes(Paths.get(invoice.getFilePath()));

            // Prepare email context
            Context context = new Context();
            context.setVariable("customer", order.getUser());
            context.setVariable("order", order);
            context.setVariable("invoice", invoice);

            String subject = invoice.getInvoiceTemplate() != null ? 
                    invoice.getInvoiceTemplate().getSubject() : 
                    "Your Invoice - Fascinito";

            String htmlContent = templateEngine.process("invoice-email", context);

            // Send email with PDF attachment
            sendEmailWithAttachment(
                    recipientEmail,
                    subject,
                    htmlContent,
                    "invoice_" + invoice.getInvoiceNumber() + ".pdf",
                    pdfBytes
            );

            // Mark invoice as email sent
            invoice.setEmailSent(true);
            invoice.setEmailSentAt(LocalDateTime.now());
            invoiceRepository.save(invoice);

            // Log success
            logEmail(EmailLog.EmailType.INVOICE, recipientEmail, subject, true, null, order.getId(), invoiceId);
            log.info("Invoice email sent successfully to: {} for invoice: {}", recipientEmail, invoice.getInvoiceNumber());

        } catch (IOException | MessagingException e) {
            log.error("Error sending invoice email for invoiceId: {}", invoiceId, e);
            logEmail(EmailLog.EmailType.INVOICE, recipientEmail, "Invoice Email", false, e.getMessage(), order.getId(), invoiceId);
        }
    }

    @Async("taskExecutor")
    @Transactional
    public void sendOrderConfirmationEmail(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("Order not found for id: {}", orderId);
            return;
        }

        String recipientEmail = order.getUser().getEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Customer email not found for order: {}", order.getOrderNumber());
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("customer", order.getUser());
            context.setVariable("order", order);
            context.setVariable("orderItems", order.getItems());

            String subject = "Order Confirmation - #" + order.getOrderNumber();
            String htmlContent = templateEngine.process("order-confirmation-email", context);

            sendEmail(recipientEmail, subject, htmlContent);

            logEmail(EmailLog.EmailType.ORDER_CONFIRMATION, recipientEmail, subject, true, null, orderId, null);
            log.info("Order confirmation email sent to: {}", recipientEmail);

        } catch (MessagingException e) {
            log.error("Error sending order confirmation email for orderId: {}", orderId, e);
            logEmail(EmailLog.EmailType.ORDER_CONFIRMATION, recipientEmail, "Order Confirmation", false, e.getMessage(), orderId, null);
        }
    }

    @Async("taskExecutor")
    @Transactional
    public void sendOrderStatusUpdateEmail(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("Order not found for id: {}", orderId);
            return;
        }

        String recipientEmail = order.getUser().getEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Customer email not found for order: {}", order.getOrderNumber());
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("customer", order.getUser());
            context.setVariable("order", order);
            context.setVariable("newStatus", newStatus);

            String subject = "Order Status Update - #" + order.getOrderNumber();
            String htmlContent = templateEngine.process("order-status-email", context);

            sendEmail(recipientEmail, subject, htmlContent);

            logEmail(EmailLog.EmailType.STATUS_UPDATE, recipientEmail, subject, true, null, orderId, null);
            log.info("Status update email sent to: {} for status: {}", recipientEmail, newStatus);

        } catch (MessagingException e) {
            log.error("Error sending status update email for orderId: {}", orderId, e);
            logEmail(EmailLog.EmailType.STATUS_UPDATE, recipientEmail, "Status Update", false, e.getMessage(), orderId, null);
        }
    }

    @Async("taskExecutor")
    @Transactional
    public void sendPaymentSuccessEmail(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("Order not found for id: {}", orderId);
            return;
        }

        String recipientEmail = order.getUser().getEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Customer email not found for order: {}", order.getOrderNumber());
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("customer", order.getUser());
            context.setVariable("order", order);
            context.setVariable("payment", order.getPayment());

            String subject = "Payment Received - #" + order.getOrderNumber();
            String htmlContent = templateEngine.process("payment-success-email", context);

            sendEmail(recipientEmail, subject, htmlContent);

            logEmail(EmailLog.EmailType.PAYMENT_SUCCESS, recipientEmail, subject, true, null, orderId, null);
            log.info("Payment success email sent to: {}", recipientEmail);

        } catch (MessagingException e) {
            log.error("Error sending payment success email for orderId: {}", orderId, e);
            logEmail(EmailLog.EmailType.PAYMENT_SUCCESS, recipientEmail, "Payment Success", false, e.getMessage(), orderId, null);
        }
    }

    @Async("taskExecutor")
    @Transactional
    public void sendRefundNotificationEmail(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("Order not found for id: {}", orderId);
            return;
        }

        String recipientEmail = order.getUser().getEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Customer email not found for order: {}", order.getOrderNumber());
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("customer", order.getUser());
            context.setVariable("order", order);

            String subject = "Refund Processed - #" + order.getOrderNumber();
            String htmlContent = templateEngine.process("refund-email", context);

            sendEmail(recipientEmail, subject, htmlContent);

            logEmail(EmailLog.EmailType.REFUND_NOTIFICATION, recipientEmail, subject, true, null, orderId, null);
            log.info("Refund notification email sent to: {}", recipientEmail);

        } catch (MessagingException e) {
            log.error("Error sending refund email for orderId: {}", orderId, e);
            logEmail(EmailLog.EmailType.REFUND_NOTIFICATION, recipientEmail, "Refund Notification", false, e.getMessage(), orderId, null);
        }
    }

    private void sendEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(appConfig.getMail().getFrom());
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    private void sendEmailWithAttachment(String to, String subject, String htmlContent, String attachmentName, byte[] attachmentBytes) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(appConfig.getMail().getFrom());
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        helper.addAttachment(attachmentName, new ByteArrayResource(attachmentBytes));

        mailSender.send(message);
    }

    private void logEmail(EmailLog.EmailType emailType, String recipient, String subject, Boolean success, String errorMessage, Long orderId, Long invoiceId) {
        try {
            EmailLog log = EmailLog.builder()
                    .emailType(emailType)
                    .recipient(recipient)
                    .subject(subject)
                    .success(success)
                    .errorMessage(errorMessage)
                    .orderId(orderId)
                    .invoiceId(invoiceId)
                    .retryCount(0)
                    .build();

            emailLogRepository.save(log);
        } catch (Exception e) {
            log.error("Error logging email", e);
        }
    }
}
