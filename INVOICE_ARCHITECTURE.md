# Invoice Feature - Architecture & Implementation Details

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Material-UI)              │
├─────────────────────────────────────────────────────────────┤
│  Admin: InvoiceTemplates.tsx                                 │
│  Admin: Invoices.tsx                                         │
│  Customer: Invoices.tsx                                      │
│  Admin: OrderDetailsPage.tsx (invoice section)              │
└─────────────────────────────────────────────────────────────┘
                           ↓ (REST API)
┌─────────────────────────────────────────────────────────────┐
│             Backend Controllers (Spring Boot)               │
├─────────────────────────────────────────────────────────────┤
│  InvoiceController.java                                      │
│  InvoiceTemplateController.java                              │
│                                                               │
│  Endpoints:                                                  │
│  ├─ POST /invoices/generate/{orderId}                       │
│  ├─ POST /invoices/{invoiceId}/resend-email                 │
│  ├─ POST /invoices/{invoiceId}/regenerate                   │
│  ├─ GET /invoices/admin/all                                 │
│  ├─ GET /invoices/my-invoices (CUSTOMER)                    │
│  ├─ GET /invoices/{invoiceId}/download                      │
│  └─ [Invoice Template CRUD endpoints]                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  InvoiceService.java                                         │
│  ├─ generateInvoice(orderId, templateId)                    │
│  ├─ regenerateInvoice(invoiceId)                            │
│  ├─ getInvoiceByOrderId(orderId)                            │
│  └─ htmlToPdf(htmlContent)                                  │
│                                                               │
│  InvoiceTemplateService.java                                 │
│  ├─ createTemplate(request)                                  │
│  ├─ updateTemplate(id, request)                              │
│  └─ getActiveTemplate(type)                                  │
│                                                               │
│  EmailService.java                                           │
│  └─ @Async sendInvoiceEmail(invoiceId)                      │
│     (Non-blocking, runs in background)                       │
│                                                               │
│  AppConfig.java                                              │
│  └─ Configuration properties (invoice paths, base URL)       │
│                                                               │
│  AsyncConfig.java                                            │
│  └─ ThreadPoolTaskExecutor (core=2, max=5, queue=100)       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Template Processing                        │
├─────────────────────────────────────────────────────────────┤
│  Thymeleaf Engine                                            │
│  ├─ invoice-template.html (PDF generation template)         │
│  │  └─ Variables: ${order}, ${invoice}, ${template}         │
│  │                                                            │
│  └─ invoice-email.html (Email body template)                │
│     └─ Variables: ${customer}, ${order}, ${invoice}         │
│                                                               │
│  HTML ─→ Flying Saucer (ITextRenderer) ─→ PDF              │
│         (CSS + HTML to PDF conversion)                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data Persistence Layer                     │
├─────────────────────────────────────────────────────────────┤
│  JPA Repositories:                                           │
│  ├─ InvoiceRepository                                        │
│  ├─ InvoiceTemplateRepository                                │
│  ├─ EmailLogRepository                                       │
│  └─ [Other repositories]                                     │
│                                                               │
│  JPA Entities:                                               │
│  ├─ Invoice                                                  │
│  ├─ InvoiceTemplate                                          │
│  ├─ EmailLog                                                 │
│  ├─ Order                                                    │
│  ├─ OrderItem                                                │
│  ├─ User                                                     │
│  └─ Payment                                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  ├─ invoices (generated invoice records)                    │
│  ├─ invoice_templates (customizable templates)              │
│  ├─ email_logs (tracking all emails)                        │
│  ├─ orders (customer orders)                                │
│  ├─ order_items (items in order)                            │
│  ├─ users (customers/staff)                                 │
│  ├─ payments (payment info)                                 │
│  └─ [Other tables]                                          │
│                                                               │
│  File Storage:                                               │
│  └─ /uploads/invoices/ (PDF files)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Generate Invoice

```
Request: POST /invoices/generate/1
         ↓
[InvoiceController]
         ↓
[InvoiceService.generateInvoice()]
         ↓
1️⃣  Load Order from DB
    └─ order_id = 1
         ↓
2️⃣  Check if invoice already exists
    └─ Prevent duplicates
         ↓
3️⃣  Select Template
    ├─ If templateId provided: load specific template
    └─ Else: load default REGULAR template
         ↓
4️⃣  Prepare Thymeleaf Context
    ├─ Set ${order} = Order object
    ├─ Set ${invoice} = Invoice entity
    └─ Set ${template} = InvoiceTemplate entity
         ↓
5️⃣  Render HTML
    ├─ Process: "invoice-template.html"
    └─ Output: HTML string with all variables substituted
         ↓
6️⃣  Convert HTML to PDF
    ├─ ITextRenderer.render()
    ├─ Flying Saucer handles CSS + HTML
    └─ Output: byte[] (PDF file)
         ↓
7️⃣  Save PDF File
    └─ /uploads/invoices/INV-2025-00001.pdf
         ↓
8️⃣  Create Invoice Entity
    ├─ invoiceNumber: INV-2025-00001
    ├─ filePath: /uploads/invoices/INV-2025-00001.pdf
    ├─ emailSent: false
    └─ generatedAt: NOW()
         ↓
9️⃣  Save Invoice to DB
         ↓
Response: 201 Created
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2025-00001",
    "emailSent": false,
    "fileUrl": "http://localhost:8080/api/invoices/INV-2025-00001/download"
  }
}
```

---

## Data Flow: Send Email

```
Request: POST /invoices/1/resend-email
         ↓
[InvoiceController]
         ↓
[EmailService.sendInvoiceEmail()] @Async
         ↓
[ThreadPoolTaskExecutor - Background Thread]
         ↓
1️⃣  Load Invoice from DB
    └─ Get PDF file path, user email, template
         ↓
2️⃣  Read PDF File
    └─ Files.readAllBytes(filePath) → byte[]
         ↓
3️⃣  Prepare Email Context
    ├─ ${customer} = order.user
    ├─ ${order} = order
    └─ ${invoice} = invoice
         ↓
4️⃣  Render Email Template
    ├─ Process: "invoice-email.html"
    └─ Output: HTML email body
         ↓
5️⃣  Create MIME Message
    ├─ To: customer.email
    ├─ Subject: from template.subject
    ├─ Body: HTML content
    └─ Attachment: PDF (invoice.pdf)
         ↓
6️⃣  Send via JavaMailSender
    └─ SMTP → noreply@fascinito.in → customer.email
         ↓
7️⃣  Update Invoice Status
    ├─ emailSent = true
    └─ emailSentAt = NOW()
         ↓
8️⃣  Log Email Event
    └─ INSERT INTO email_logs (success=true, type=INVOICE)
         ↓
Response (Immediate): 200 OK
{
  "success": true,
  "message": "Invoice email sent successfully",
  "data": "Email is being sent"
}

[Background Processing Continues...]
```

---

## Entity Relationships

```
Order (1)
  ├─ User (many) ─ Invoice ─ Customer views their invoices
  ├─ OrderItem (many) ─ Product ─ Used in PDF template
  ├─ Payment (1) ─ Optional ─ Payment details in invoice
  └─ Invoice (1) ─ One invoice per order
       └─ InvoiceTemplate ─ Visual design
       └─ EmailLog ─ Email sending history

InvoiceTemplate (1)
  └─ Template Types: REGULAR, FESTIVAL, PROMOTIONAL, VIP
       └─ Used by multiple invoices

EmailLog (many)
  ├─ Invoice (1) ─ Which invoice was emailed
  ├─ Order (1) ─ Which order/customer
  └─ Type: INVOICE, ORDER_CONFIRMATION, etc.
```

---

## Class Diagram

```
┌──────────────────────────┐
│    InvoiceController     │
├──────────────────────────┤
│ - invoiceService         │
│ - emailService           │
├──────────────────────────┤
│ + generateInvoice()      │
│ + regenerateInvoice()    │
│ + resendInvoiceEmail()   │
│ + getAllInvoices()       │
│ + getMyInvoices()        │
│ + downloadInvoice()      │
└──────────────────────────┘
           ↓
┌──────────────────────────────────┐
│     InvoiceService               │
├──────────────────────────────────┤
│ - invoiceRepository              │
│ - orderRepository                │
│ - invoiceTemplateRepository      │
│ - templateEngine (Thymeleaf)     │
│ - appConfig                      │
├──────────────────────────────────┤
│ + generateInvoice()              │
│ + regenerateInvoice()            │
│ + htmlToPdf()                    │
│ + savePdfFile()                  │
│ - prepareInvoiceContext()        │
│ - generateInvoiceNumber()        │
└──────────────────────────────────┘
           ↓
┌──────────────────────────┐
│     EmailService         │
├──────────────────────────┤
│ - mailSender (SMTP)      │
│ - templateEngine         │
│ - emailLogRepository     │
├──────────────────────────┤
│ + @Async                 │
│   sendInvoiceEmail()     │
│ + sendEmailWithAttachment│
│ - logEmail()             │
└──────────────────────────┘
```

---

## Configuration Files

### 1. AsyncConfig.java
```java
@Configuration
@EnableAsync
public class AsyncConfig {
    
    @Bean(name = "taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);           // Min threads
        executor.setMaxPoolSize(5);            // Max threads
        executor.setQueueCapacity(100);        // Queue size
        executor.setThreadNamePrefix("invoice-email-");
        executor.initialize();
        return executor;
    }
}
```

### 2. AppConfig.java
```java
@Component
@ConfigurationProperties(prefix = "app")
@Data
public class AppConfig {
    private MailConfig mail;
    private InvoiceConfig invoice;
    
    @Data
    public static class InvoiceConfig {
        private String uploadPath;   // /uploads/invoices
        private String baseUrl;      // http://localhost:8080
    }
}
```

### 3. application.yml
```yaml
app:
  invoice:
    upload-path: ${UPLOAD_BASE_PATH:uploads}/invoices
    base-url: ${API_BASE_URL:http://localhost:8080}

spring:
  mail:
    host: smtp.hostinger.com
    port: 587
    username: noreply@fascinito.in
    password: ${MAIL_PASSWORD}
```

---

## Error Handling

```
generateInvoice()
├─ OrderNotFoundException
│  └─ "Order not found with id: {id}"
├─ BadRequestException
│  └─ "Invoice already exists for this order"
└─ RuntimeException
   └─ "Failed to generate invoice PDF"

sendInvoiceEmail()
├─ LogWarning: "Invoice not found"
├─ LogWarning: "Customer email not available"
└─ MessagingException
   └─ Logged in email_logs table (success=false)
```

---

## Async Processing

### ThreadPool Configuration
```
Core Pool Size:  2  (always active threads)
Max Pool Size:   5  (scale up to 5 when needed)
Queue Capacity:  100 (hold 100 jobs if threads busy)
Keep Alive:      60s (terminate if not used)

Behavior:
1-2 emails: Instant (core threads available)
3-5 emails: Queue them (create new threads)
6+ emails: Add to queue (wait for thread available)
100+ emails: Queue full (new requests rejected)
```

### Advantages
✅ Non-blocking - API responds immediately
✅ Scalable - Can handle many emails
✅ Resilient - Failed emails don't crash app
✅ Trackable - All attempts logged

---

## Template Variables Available

### invoice-template.html (PDF)
```html
<!-- Order Information -->
${order.orderNumber}
${order.createdAt}
${order.totalAmount}
${order.subtotal}
${order.taxAmount}
${order.shippingCost}
${order.discount}

<!-- Customer Information -->
${order.user.firstName}
${order.user.lastName}
${order.user.email}
${order.user.phone}
${order.shippingAddress}

<!-- Invoice Information -->
${invoice.invoiceNumber}
${invoice.generatedAt}
${invoice.fileUrl}

<!-- Template Information -->
${template.logoUrl}
${template.bannerUrl}
${template.footerNote}
${template.primaryColor}

<!-- Order Items Loop -->
<tr th:each="item : ${order.items}">
  ${item.product.title}
  ${item.quantity}
  ${item.unitPrice}
  ${item.taxAmount}
  ${item.totalPrice}
</tr>

<!-- Payment Information -->
${order.payment.paymentMethod}
${order.payment.status}
${order.payment.transactionId}
```

### invoice-email.html (Email Body)
```html
${customer.firstName}
${customer.lastName}
${customer.email}

${order.orderNumber}
${order.totalAmount}

${invoice.invoiceNumber}
${invoice.fileUrl}

[PDF Attachment: invoice_{invoiceNumber}.pdf]
```

---

## Performance Optimization

### 1. Database Queries
- JPA `@EntityGraph` for lazy loading
- Batch fetch size: 10 (application.yml)
- Connection pooling: HikariCP

### 2. PDF Generation
- Caching: Template compiled once
- Streaming: Large PDFs handled efficiently
- Async: Non-blocking email processing

### 3. Concurrency
- ThreadPoolTaskExecutor: Parallel email sending
- Queue-based: Prevents resource exhaustion
- Transaction management: `@Transactional` on all DB ops

---

## Testing Checklist

```
✅ Template Creation
  ├─ Create template with all types
  └─ Set colors, logos, footer text

✅ Invoice Generation
  ├─ Generate with default template
  ├─ Generate with specific templateId
  ├─ Check PDF file created
  ├─ Check database entry created
  └─ Verify emailSent = false

✅ Email Sending
  ├─ Send email (manual trigger)
  ├─ Check emailSent = true
  ├─ Verify email_logs entry
  ├─ Customer receives email
  └─ PDF attachment included

✅ Admin Dashboard
  ├─ View all invoices list
  ├─ Download PDF works
  ├─ Regenerate creates new PDF
  ├─ Resend email button works
  └─ Pagination works

✅ Customer Portal
  ├─ Customer sees own invoices
  ├─ Download button works
  ├─ Cannot regenerate (auth check)
  └─ Pagination works
```

---

## Files Location

```
Backend:
├── src/main/java/com/fascinito/pos/
│   ├── controller/
│   │   ├── InvoiceController.java
│   │   └── InvoiceTemplateController.java
│   ├── service/
│   │   ├── InvoiceService.java
│   │   ├── InvoiceTemplateService.java
│   │   └── EmailService.java
│   ├── entity/
│   │   ├── Invoice.java
│   │   ├── InvoiceTemplate.java
│   │   └── EmailLog.java
│   ├── repository/
│   │   ├── InvoiceRepository.java
│   │   ├── InvoiceTemplateRepository.java
│   │   └── EmailLogRepository.java
│   ├── dto/invoice/
│   │   ├── InvoiceResponse.java
│   │   └── InvoiceTemplateResponse.java
│   └── config/
│       ├── AsyncConfig.java
│       └── AppConfig.java
└── src/main/resources/templates/
    ├── invoice-template.html
    └── invoice-email.html

Frontend:
├── src/pages/
│   ├── admin/
│   │   ├── InvoiceTemplates.tsx
│   │   └── Invoices.tsx
│   └── customer/
│       └── Invoices.tsx
└── src/services/
    └── invoiceService.ts
```

---

## Deployment Checklist

```
Docker:
✅ Environment variables set
  ├─ MAIL_PASSWORD
  ├─ UPLOAD_BASE_PATH=/uploads
  ├─ API_BASE_URL=https://api.fascinito.in
  └─ MAIL_HOST, MAIL_USERNAME

✅ Directories created
  └─ /uploads/invoices/ (with write permissions)

✅ Database migrations run
  └─ All tables created

✅ SMTP credentials verified
  ├─ Test email sends successfully
  └─ Check spam/verification folders

✅ SSL/TLS configured
  ├─ SMTP over TLS (port 587)
  └─ API over HTTPS
```

---

## Summary

This invoice system provides:
- **Automated PDF generation** using Thymeleaf + Flying Saucer
- **Customizable templates** (4 types with branding options)
- **Async email delivery** (non-blocking, queued processing)
- **Complete tracking** (email_logs table)
- **Admin dashboard** (full invoice management)
- **Customer portal** (view own invoices)
- **Scalable architecture** (ThreadPoolTaskExecutor)

Remember: **Emails are NOT automatic** - explicit trigger required via API or dashboard button.
