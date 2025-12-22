# Invoice Feature - Complete Usage Guide

## Overview

The invoice feature is a complete system for generating, managing, and distributing professional PDF invoices with automatic email delivery. It includes customizable templates (REGULAR, FESTIVAL, PROMOTIONAL, VIP) with custom branding.

---

## Key Features

✅ **PDF Generation** - Automatically converts order data to professional PDF invoices
✅ **Multiple Templates** - 4 customizable template types with different branding
✅ **Async Email** - Non-blocking email delivery using ThreadPoolTaskExecutor
✅ **Email Tracking** - Tracks all email deliveries with success/failure logs
✅ **Invoice Management** - Admin dashboard to view, download, regenerate, and resend invoices
✅ **Customer Portal** - Customers can view their own invoices
✅ **Custom Branding** - Add logo, festival banner, footer notes to templates

---

## Will Emails Send Automatically?

### ❌ **NO - Emails are NOT sent automatically during invoice generation**

**Important:** The invoice generation endpoint (`POST /invoices/generate/{orderId}`) only:
- Creates a PDF file
- Stores invoice record in database
- Sets `emailSent = false`

It does **NOT** send an email. You must explicitly trigger email sending.

### How to Send Emails - 3 Options:

#### **Option 1: Send Email Immediately After Generation** (Recommended)
```bash
# Step 1: Generate invoice
POST /api/invoices/generate/1

# Step 2: Send email manually
POST /api/invoices/{invoiceId}/resend-email
```

#### **Option 2: Resend Email from Admin Dashboard**
- Go to **Admin → Invoices**
- Find the invoice
- Click **"Send Email"** button
- Email is sent asynchronously (non-blocking)

#### **Option 3: Batch Email Processing** (Future Enhancement)
You can later implement scheduled jobs to send emails for all unpaid invoices daily/weekly.

---

## How to Use - Step-by-Step

### **Phase 1: Set Up Invoice Templates**

#### 1.1 Create a Template
```
Admin Dashboard → Invoice Templates → Create Template
```

**Fields to Configure:**
- **Template Type**: REGULAR, FESTIVAL, PROMOTIONAL, or VIP
- **Name**: e.g., "Summer Sale 2025"
- **Subject**: Email subject line (e.g., "Your Invoice - 20% Summer Discount!")
- **Logo URL**: Company logo (optional)
- **Banner URL**: Festival/promotional banner (optional)
- **Show Festival Banner**: Toggle to display banner in PDF
- **Footer Note**: Custom message at bottom (e.g., "Thank you for shopping!")
- **Primary Color**: Hex color for template accent (#667eea default)
- **Secondary Color**: Hex color for highlights
- **Active**: Enable/disable template

**Example:**
```json
{
  "templateType": "FESTIVAL",
  "name": "Diwali 2025 Template",
  "subject": "Your Diwali Special Invoice - Fascinito",
  "logoUrl": "https://fascinito.in/logo.png",
  "bannerUrl": "https://fascinito.in/diwali-banner.jpg",
  "showFestivalBanner": true,
  "footerNote": "Wishing you a happy Diwali! 🎉",
  "primaryColor": "#FF6B35",
  "secondaryColor": "#FFD700",
  "active": true
}
```

#### 1.2 View All Templates
```
Admin Dashboard → Invoice Templates → View List
```

---

### **Phase 2: Generate Invoices**

#### 2.1 Generate Invoice with Default Template
```bash
POST /api/invoices/generate/1
Authorization: Bearer {ADMIN_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2025-00001",
    "orderNumber": "ORD-1234",
    "emailSent": false,
    "generatedAt": "2025-12-22T10:35:30",
    "fileUrl": "http://localhost:8080/api/invoices/INV-2025-00001/download"
  }
}
```

#### 2.2 Generate Invoice with Specific Template
```bash
POST /api/invoices/generate/1?templateId=5
Authorization: Bearer {ADMIN_TOKEN}
```

#### 2.3 What Happens During Generation:
1. ✅ Order data is validated
2. ✅ Invoice template is selected (or default REGULAR)
3. ✅ Thymeleaf converts HTML template to dynamic content
4. ✅ HTML is rendered to PDF using Flying Saucer
5. ✅ PDF is saved to `/uploads/invoices/` directory
6. ✅ Invoice record created in database
7. ✅ `emailSent` flag set to `false`

---

### **Phase 3: Send Invoice Emails**

#### 3.1 Send Email to Customer
```bash
POST /api/invoices/{invoiceId}/resend-email
Authorization: Bearer {ADMIN_TOKEN}
```

**What Happens (Asynchronous):**
1. Invoice PDF is read from disk
2. Email template is rendered with order details
3. Email sent with PDF attachment (background thread)
4. `emailSent` flag updated to `true`
5. Email delivery logged in `email_logs` table
6. No blocking - response returns immediately

**Response:**
```json
{
  "success": true,
  "message": "Invoice email sent successfully",
  "data": "Email is being sent"
}
```

#### 3.2 Email Details:
- **To**: Customer email address
- **Subject**: From template configuration
- **Body**: Uses `invoice-email.html` template
- **Attachment**: Invoice PDF file
- **Async Processing**: Uses ThreadPoolTaskExecutor (core=2, max=5, queue=100)

---

### **Phase 4: Manage Invoices**

#### 4.1 Admin Dashboard - Invoices
```
Admin Dashboard → Invoices → View All
```

**Available Actions:**
| Action | Endpoint | Purpose |
|--------|----------|---------|
| 📥 **Download** | GET `/invoices/{invoiceId}/download` | Download PDF file |
| 📧 **Resend Email** | POST `/invoices/{invoiceId}/resend-email` | Send email again |
| 🔄 **Regenerate** | POST `/invoices/{invoiceId}/regenerate` | Recreate PDF (new design) |
| 👁️ **Preview** | GET `/invoices/{invoiceId}/preview` | View in browser |

**Search & Filter:**
- Filter by invoice status
- Search by invoice number
- Sort by date
- Pagination

#### 4.2 Regenerate Invoice (Use New Template)
```bash
POST /api/invoices/5/regenerate
Authorization: Bearer {ADMIN_TOKEN}
```

**When to Use:**
- Customer requests new design
- Template colors changed
- Need to update logo/branding
- Fix errors in previous invoice

**Note:** Old PDF file is replaced, regeneration count increments

---

### **Phase 5: Customer Portal - View Own Invoices**

#### 5.1 Access Customer Invoices
```
Customer Dashboard → My Invoices
```

**Customer View:**
- List of all their invoices
- Invoice number, date, amount
- **Download** button for each invoice
- Cannot regenerate or resend (admin only)

#### 5.2 API Endpoint
```bash
GET /api/invoices/my-invoices?page=0&size=10
Authorization: Bearer {CUSTOMER_TOKEN}
```

---

## Database Tables

### **invoices** Table
```sql
- id: PRIMARY KEY
- invoice_number: UNIQUE (INV-YYYY-XXXXX format)
- order_id: OneToOne with orders
- user_id: OneToOne with users
- template_id: ManyToOne with invoice_templates
- file_path: Local file path to PDF
- file_url: Public URL to download
- email_sent: BOOLEAN (false = not sent, true = sent)
- email_sent_at: TIMESTAMP
- regenerated_count: INT (tracks regenerations)
- generated_at: TIMESTAMP
```

### **invoice_templates** Table
```sql
- id: PRIMARY KEY
- template_type: ENUM (REGULAR, FESTIVAL, PROMOTIONAL, VIP)
- name: VARCHAR
- subject: VARCHAR (email subject)
- logo_url: VARCHAR
- banner_url: VARCHAR
- show_festival_banner: BOOLEAN
- footer_note: TEXT
- primary_color: VARCHAR (hex)
- secondary_color: VARCHAR (hex)
- active: BOOLEAN
```

### **email_logs** Table
```sql
- id: PRIMARY KEY
- email_type: ENUM (INVOICE, ORDER_CONFIRMATION, STATUS_UPDATE, PAYMENT_SUCCESS, REFUND_NOTIFICATION)
- recipient_email: VARCHAR
- subject: VARCHAR
- success: BOOLEAN
- error_message: TEXT (if failed)
- sent_at: TIMESTAMP
- order_id: FK
- invoice_id: FK
```

---

## Configuration

### Email Settings (application.yml)
```yaml
spring:
  mail:
    host: smtp.hostinger.com          # SMTP server
    port: 587                          # TLS port
    username: noreply@fascinito.in    # From email
    password: ${MAIL_PASSWORD}         # App password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true

app:
  mail:
    from: "Fascinito <noreply@fascinito.in>"
    admin: admin@fascinito.in
  invoice:
    upload-path: ${UPLOAD_BASE_PATH:uploads}/invoices
    base-url: ${API_BASE_URL:http://localhost:8080}
```

### Async Configuration
```java
// ThreadPoolTaskExecutor Configuration
- Core Pool Size: 2
- Max Pool Size: 5
- Queue Capacity: 100
- Thread Name Prefix: invoice-email-

// Benefit: Can process 100 concurrent email jobs without blocking
```

---

## Common Workflows

### **Workflow 1: Order Placed → Invoice Generated → Email Sent**
```
1. Customer places order
2. Order confirmed (OrderController)
3. Admin receives notification
4. Admin clicks "Generate Invoice" button
5. POST /invoices/generate/1
6. Invoice PDF created
7. Admin clicks "Send Email"
8. POST /invoices/1/resend-email
9. Customer receives email with invoice PDF
```

### **Workflow 2: Regenerate Invoice with New Template**
```
1. Admin needs to change invoice design
2. Create new template (e.g., "Festive Design")
3. Go to existing invoice
4. Click "Regenerate"
5. POST /invoices/5/regenerate
6. New PDF created with latest template
7. Old email NOT resent automatically
8. Admin sends email again if needed
```

### **Workflow 3: Customer Views Their Invoices**
```
1. Customer logs in
2. Navigate to "My Invoices"
3. View all invoices for their orders
4. Click "Download" for any invoice
5. PDF downloads to computer
6. Cannot modify or regenerate (admin-only actions)
```

---

## API Reference

### **Invoice Generation**
```
POST /api/invoices/generate/{orderId}
Authorization: Bearer {ADMIN_TOKEN}
Query Params: templateId (optional)

Response: 201 Created
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2025-00001",
    "emailSent": false
  }
}
```

### **Send Invoice Email**
```
POST /api/invoices/{invoiceId}/resend-email
Authorization: Bearer {ADMIN_TOKEN}

Response: 200 OK
{
  "success": true,
  "message": "Invoice email sent successfully",
  "data": "Email is being sent"
}
```

### **Regenerate Invoice**
```
POST /api/invoices/{invoiceId}/regenerate
Authorization: Bearer {ADMIN_TOKEN}

Response: 200 OK
{
  "success": true,
  "data": {
    "invoiceNumber": "INV-2025-00001",
    "regeneratedCount": 1
  }
}
```

### **Get Invoice**
```
GET /api/invoices/{invoiceId}
Authorization: Bearer {ANY_TOKEN}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### **List All Invoices (Admin)**
```
GET /api/invoices/admin/all?page=0&size=10
Authorization: Bearer {ADMIN_TOKEN}

Response: 200 OK
{
  "content": [ ... ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 50,
  "totalPages": 5
}
```

### **Get My Invoices (Customer)**
```
GET /api/invoices/my-invoices?page=0&size=10
Authorization: Bearer {CUSTOMER_TOKEN}

Response: 200 OK
{
  "content": [ ... ],
  "pageNumber": 0,
  "pageSize": 10
}
```

### **Download Invoice PDF**
```
GET /api/invoices/{invoiceId}/download
Authorization: Bearer {ANY_TOKEN}

Response: 200 OK (file/pdf)
[Binary PDF file content]
```

---

## Permissions Required

| Feature | Role Required | Endpoint |
|---------|---------------|----------|
| Generate Invoice | ADMIN, STAFF | POST /invoices/generate/{orderId} |
| Regenerate | ADMIN, STAFF | POST /invoices/{invoiceId}/regenerate |
| Send Email | ADMIN, STAFF | POST /invoices/{invoiceId}/resend-email |
| View All | ADMIN, STAFF | GET /invoices/admin/all |
| View Own | CUSTOMER | GET /invoices/my-invoices |
| Download | ANY | GET /invoices/{invoiceId}/download |

---

## Email Template Files

### **invoice-template.html**
- Main PDF template (Thymeleaf)
- Includes order details, items, totals
- Responsive HTML/CSS styling
- Variables: `${order}`, `${invoice}`, `${template}`

### **invoice-email.html**
- Email body template
- Welcomes customer
- Includes invoice details
- Call-to-action buttons
- Variables: `${customer}`, `${order}`, `${invoice}`

---

## Troubleshooting

### **❌ Invoice Generation Fails**
**Error:** `Template parsing failed`
- Check that order exists with ID
- Ensure all related entities are loaded (user, payment, items)
- Verify template HTML syntax

### **❌ Email Not Sent**
**Error:** `SMTP connection failed`
- Check email configuration in `application.yml`
- Verify SMTP credentials and password
- Check if firewall blocks port 587

### **❌ PDF File Not Found**
**Error:** `File not found at path`
- Check `/uploads/invoices/` directory exists
- Verify write permissions
- Check `UPLOAD_BASE_PATH` environment variable

### **❌ Async Email Timeout**
**Solution:** Check ThreadPoolTaskExecutor queue (100 max)
- If queue is full, increase max pool size in `AsyncConfig.java`
- Monitor background email jobs

---

## Next Steps to Implement (Optional)

1. **Auto-Send on Order Confirmation**
   - Trigger email automatically when order status = CONFIRMED
   - Integrate with OrderService

2. **Scheduled Email Reminders**
   - Send invoice reminders for unpaid orders (daily)
   - Cron job: `0 9 * * *` (9 AM daily)

3. **Invoice Watermarking**
   - Add "DRAFT" watermark for pending orders
   - Add "PAID" watermark for completed orders

4. **Custom Invoice Numbers**
   - Sequence: INV-YYYY-{autoincrement}
   - Currently: INV-YYYY-00001 format

5. **Bulk Invoice Generation**
   - Generate invoices for multiple orders at once
   - Batch email sending

6. **Invoice Analytics**
   - Track generation time
   - Email delivery success rate
   - Most used template

---

## Summary

| Feature | Status | Manual/Auto |
|---------|--------|------------|
| Invoice Generation | ✅ Ready | Manual (admin triggers) |
| PDF Creation | ✅ Ready | Automatic during generation |
| Email Sending | ✅ Ready | Manual (requires explicit action) |
| Email Tracking | ✅ Ready | Automatic (logged in database) |
| Customer Portal | ✅ Ready | Automatic (view own invoices) |
| Admin Dashboard | ✅ Ready | Manual (manage invoices) |

**Key Point:** Emails are NOT automatic. Use `POST /invoices/{invoiceId}/resend-email` after generation.

---

## Quick Start Example

```bash
# 1. Create a template (via Admin UI)
POST /api/invoice-templates
{
  "templateType": "REGULAR",
  "name": "Standard Invoice",
  "subject": "Your Invoice from Fascinito",
  "footerNote": "Thank you for your purchase!",
  "active": true
}

# 2. Generate invoice
POST /api/invoices/generate/1
Header: Authorization: Bearer {ADMIN_TOKEN}
# Response: invoiceId = 1

# 3. Send email to customer
POST /api/invoices/1/resend-email
Header: Authorization: Bearer {ADMIN_TOKEN}
# Customer receives email with PDF attachment

# 4. Customer downloads from portal
GET /api/invoices/my-invoices
Header: Authorization: Bearer {CUSTOMER_TOKEN}
```

---

**Support:** For issues, check logs at `/uploads/invoices/` or email_logs table
