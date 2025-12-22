package com.fascinito.pos.service;

import com.fascinito.pos.entity.EmailLog;
import com.fascinito.pos.entity.Invoice;
import com.fascinito.pos.entity.Order;
import com.fascinito.pos.repository.EmailLogRepository;
import com.fascinito.pos.repository.InvoiceRepository;
import com.fascinito.pos.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final EmailLogRepository emailLogRepository;
    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final InvoiceService invoiceService;

    @Value("${spring.mail.properties.mail.smtp.from:noreply@fascinito.in}")
    private String fromEmail;

    @Value("${app.mail.admin:admin@fascinito.in}")
    private String adminEmail;

    /**
     * Send invoice email asynchronously
     */
    @Async("taskExecutor")
    @Transactional
    public void sendInvoiceEmail(Long orderId, Long invoiceId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            Invoice invoice = invoiceRepository.findById(invoiceId)
                    .orElseThrow(() -> new RuntimeException("Invoice not found"));

            String customerEmail = order.getUser().getEmail();
            if (customerEmail == null || customerEmail.trim().isEmpty()) {
                log.warn("Customer email not available for order: {}", orderId);
                logEmailFailure(customerEmail, "Invoice Email", orderId, invoiceId,
                        "Customer email not available");
                return;
            }

            // Read PDF file
            byte[] pdfBytes = Files.readAllBytes(Paths.get(invoice.getFilePath()));

            // Send email with PDF attachment
            sendEmailWithAttachment(
                    customerEmail,
                    "Invoice for Order #" + order.getOrderNumber(),
                    buildInvoiceEmailBody(order, invoice),
                    pdfBytes,
                    "invoice_" + invoice.getInvoiceNumber() + ".pdf",
                    EmailLog.EmailType.INVOICE,
                    orderId,
                    invoiceId
            );

            // Mark invoice as email sent
            invoiceService.markEmailSent(invoiceId);

            log.info("Invoice email sent successfully to: {} for order: {}", customerEmail, orderId);
        } catch (IOException e) {
            log.error("Error reading invoice PDF for order: {}", orderId, e);
            logEmailFailure(null, "Invoice Email", orderId, invoiceId,
                    "Error reading PDF: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error sending invoice email for order: {}", orderId, e);
            logEmailFailure(null, "Invoice Email", orderId, invoiceId,
                    "Error sending email: " + e.getMessage());
        }
    }

    /**
     * Send order confirmation email asynchronously
     */
    @Async("taskExecutor")
    @Transactional
    public void sendOrderConfirmationEmail(Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            String customerEmail = order.getUser().getEmail();
            if (customerEmail == null || customerEmail.trim().isEmpty()) {
                log.warn("Customer email not available for order: {}", orderId);
                logEmailFailure(customerEmail, "Order Confirmation", orderId, null,
                        "Customer email not available");
                return;
            }

            sendSimpleEmail(
                    customerEmail,
                    "Order Confirmation - Order #" + order.getOrderNumber(),
                    buildOrderConfirmationEmailBody(order),
                    EmailLog.EmailType.ORDER_CONFIRMATION,
                    orderId,
                    null
            );

            log.info("Order confirmation email sent to: {} for order: {}", customerEmail, orderId);
        } catch (Exception e) {
            log.error("Error sending order confirmation email for order: {}", orderId, e);
            logEmailFailure(null, "Order Confirmation", orderId, null,
                    "Error: " + e.getMessage());
        }
    }

    /**
     * Send order status update email asynchronously
     */
    @Async("taskExecutor")
    @Transactional
    public void sendOrderStatusUpdateEmail(Long orderId, String newStatus) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            String customerEmail = order.getUser().getEmail();
            if (customerEmail == null || customerEmail.trim().isEmpty()) {
                log.warn("Customer email not available for order: {}", orderId);
                logEmailFailure(customerEmail, "Status Update", orderId, null,
                        "Customer email not available");
                return;
            }

            sendSimpleEmail(
                    customerEmail,
                    "Order Status Update - Order #" + order.getOrderNumber(),
                    buildStatusUpdateEmailBody(order, newStatus),
                    EmailLog.EmailType.STATUS_UPDATE,
                    orderId,
                    null
            );

            log.info("Status update email sent to: {} for order: {} (status: {})", customerEmail, orderId, newStatus);
        } catch (Exception e) {
            log.error("Error sending status update email for order: {}", orderId, e);
            logEmailFailure(null, "Status Update", orderId, null,
                    "Error: " + e.getMessage());
        }
    }

    /**
     * Send payment success email asynchronously
     */
    @Async("taskExecutor")
    @Transactional
    public void sendPaymentSuccessEmail(Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            String customerEmail = order.getUser().getEmail();
            if (customerEmail == null || customerEmail.trim().isEmpty()) {
                log.warn("Customer email not available for order: {}", orderId);
                logEmailFailure(customerEmail, "Payment Success", orderId, null,
                        "Customer email not available");
                return;
            }

            sendSimpleEmail(
                    customerEmail,
                    "Payment Successful - Order #" + order.getOrderNumber(),
                    buildPaymentSuccessEmailBody(order),
                    EmailLog.EmailType.PAYMENT_SUCCESS,
                    orderId,
                    null
            );

            log.info("Payment success email sent to: {} for order: {}", customerEmail, orderId);
        } catch (Exception e) {
            log.error("Error sending payment success email for order: {}", orderId, e);
            logEmailFailure(null, "Payment Success", orderId, null,
                    "Error: " + e.getMessage());
        }
    }

    /**
     * Send refund notification email asynchronously
     */
    @Async("taskExecutor")
    @Transactional
    public void sendRefundNotificationEmail(Long orderId, String refundAmount) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            String customerEmail = order.getUser().getEmail();
            if (customerEmail == null || customerEmail.trim().isEmpty()) {
                log.warn("Customer email not available for order: {}", orderId);
                logEmailFailure(customerEmail, "Refund Notification", orderId, null,
                        "Customer email not available");
                return;
            }

            sendSimpleEmail(
                    customerEmail,
                    "Refund Processed - Order #" + order.getOrderNumber(),
                    buildRefundEmailBody(order, refundAmount),
                    EmailLog.EmailType.REFUND_NOTIFICATION,
                    orderId,
                    null
            );

            log.info("Refund notification email sent to: {} for order: {}", customerEmail, orderId);
        } catch (Exception e) {
            log.error("Error sending refund notification email for order: {}", orderId, e);
            logEmailFailure(null, "Refund Notification", orderId, null,
                    "Error: " + e.getMessage());
        }
    }

    /**
     * Send simple text email
     */
    private void sendSimpleEmail(String to, String subject, String body, EmailLog.EmailType emailType,
                                 Long orderId, Long invoiceId) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(body, true); // true = HTML content

        mailSender.send(message);

        logEmailSuccess(to, subject, emailType, orderId, invoiceId);
    }

    /**
     * Send email with file attachment
     */
    private void sendEmailWithAttachment(String to, String subject, String body, byte[] fileBytes,
                                        String filename, EmailLog.EmailType emailType,
                                        Long orderId, Long invoiceId) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(body, true); // true = HTML content

        // Add attachment
        helper.addAttachment(filename, new ByteArrayResource(fileBytes));

        mailSender.send(message);

        logEmailSuccess(to, subject, emailType, orderId, invoiceId);
    }

    /**
     * Build invoice email HTML body
     */
    private String buildInvoiceEmailBody(Order order, Invoice invoice) {
        Context context = new Context();
        context.setVariable("customerName", order.getUser().getFirstName());
        context.setVariable("orderNumber", order.getOrderNumber());
        context.setVariable("invoiceNumber", invoice.getInvoiceNumber());
        context.setVariable("totalAmount", order.getTotalAmount());
        context.setVariable("generatedDate", invoice.getGeneratedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")));

        return templateEngine.process("order-invoice-email", context);
    }

    /**
     * Build order confirmation email HTML body
     */
    private String buildOrderConfirmationEmailBody(Order order) {
        Context context = new Context();
        context.setVariable("customerName", order.getUser().getFirstName());
        context.setVariable("orderNumber", order.getOrderNumber());
        context.setVariable("totalAmount", order.getTotalAmount());
        context.setVariable("itemCount", order.getItems().size());
        context.setVariable("createdDate", order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm")));

        return templateEngine.process("order-confirmation-email", context);
    }

    /**
     * Build status update email HTML body
     */
    private String buildStatusUpdateEmailBody(Order order, String newStatus) {
        Context context = new Context();
        context.setVariable("customerName", order.getUser().getFirstName());
        context.setVariable("orderNumber", order.getOrderNumber());
        context.setVariable("status", newStatus);
        context.setVariable("statusDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm")));

        return templateEngine.process("order-status-email", context);
    }

    /**
     * Build payment success email HTML body
     */
    private String buildPaymentSuccessEmailBody(Order order) {
        Context context = new Context();
        context.setVariable("customerName", order.getUser().getFirstName());
        context.setVariable("orderNumber", order.getOrderNumber());
        context.setVariable("totalAmount", order.getTotalAmount());
        context.setVariable("paymentMethod", order.getPayment() != null ? order.getPayment().getPaymentMethod() : "Unknown");

        return templateEngine.process("payment-success-email", context);
    }

    /**
     * Build refund email HTML body
     */
    private String buildRefundEmailBody(Order order, String refundAmount) {
        Context context = new Context();
        context.setVariable("customerName", order.getUser().getFirstName());
        context.setVariable("orderNumber", order.getOrderNumber());
        context.setVariable("refundAmount", refundAmount);
        context.setVariable("processedDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm")));

        return templateEngine.process("refund-email", context);
    }

    /**
     * Log successful email send
     */
    @Transactional
    private void logEmailSuccess(String recipient, String subject, EmailLog.EmailType emailType,
                                Long orderId, Long invoiceId) {
        EmailLog log = EmailLog.builder()
                .emailType(emailType)
                .recipient(recipient)
                .subject(subject)
                .success(true)
                .orderId(orderId)
                .invoiceId(invoiceId)
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        emailLogRepository.save(log);
    }

    /**
     * Log failed email send
     */
    @Transactional
    private void logEmailFailure(String recipient, String subject, Long orderId, Long invoiceId,
                                String errorMessage) {
        EmailLog log = EmailLog.builder()
                .emailType(EmailLog.EmailType.INVOICE)
                .recipient(recipient)
                .subject(subject)
                .success(false)
                .errorMessage(errorMessage)
                .orderId(orderId)
                .invoiceId(invoiceId)
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        emailLogRepository.save(log);
    }
}
