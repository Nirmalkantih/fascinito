# Invoice System - Quick Start Testing Guide

## Step 1: Verify Database Setup

Make sure your database has the new invoice tables. Run these migrations:

```sql
-- Create invoice_templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    header_color VARCHAR(50),
    footer_note TEXT,
    logo_url VARCHAR(255),
    banner_url VARCHAR(255),
    show_festival_banner BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    invoice_template_id BIGINT,
    file_path VARCHAR(255),
    file_url VARCHAR(255),
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP NULL,
    regenerated_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    generated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (invoice_template_id) REFERENCES invoice_templates(id)
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email_type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    order_id BIGINT,
    invoice_id BIGINT,
    retry_count INT DEFAULT 0,
    last_retry_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Create indexes for performance
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_email_sent ON invoices(email_sent);
CREATE INDEX idx_invoice_templates_template_id ON invoice_templates(template_id);
CREATE INDEX idx_invoice_templates_active ON invoice_templates(active);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_invoice_id ON email_logs(invoice_id);
```

## Step 2: Verify File Upload Directory

Create the uploads directory for PDFs:

```bash
# From project root
mkdir -p backend/uploads/invoices
chmod 755 backend/uploads/invoices

# Verify directory structure
ls -la backend/uploads/
```

## Step 3: Check Environment Configuration

Verify your `.env` and `.env.production` have email settings:

```env
# Email Configuration
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@domain.com

# Invoice Configuration
INVOICE_UPLOAD_PATH=/uploads/invoices/
INVOICE_BASE_URL=http://localhost:8080
```

## Step 4: Create Default Invoice Template

Run this SQL to create a default template for testing:

```sql
INSERT INTO invoice_templates (
    template_id, name, description, template_type,
    subject, header_color, footer_note, active
) VALUES (
    'template-regular-default',
    'Standard Invoice',
    'Default professional invoice template',
    'REGULAR',
    'Invoice #{{invoiceNumber}} from Fascinito',
    '#667eea',
    'Thank you for your business!',
    true
);
```

## Step 5: Quick Manual Testing Workflow

### 5.1 Start Both Frontend & Backend

```bash
# Terminal 1 - Backend
cd backend
./mvnw spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5.2 Test in Browser

1. **Login as Admin:**
   - Go to `http://localhost:5173/admin/login`
   - Use your admin credentials

2. **Create an Invoice Template:**
   - Navigate to `/admin/invoice-templates`
   - Click "Add Template"
   - Fill form and save
   - Verify it appears in list

3. **Find an Order:**
   - Go to `/admin/orders`
   - Click on any existing order

4. **Generate Invoice:**
   - Scroll to "Invoice" section
   - Click "Generate Invoice" button
   - Wait for success toast

5. **Download PDF:**
   - Click "Download PDF" button
   - Check `/uploads/invoices/` directory
   - Open PDF to verify content

6. **Send Email:**
   - Click "Send Email" button
   - Check customer email inbox
   - Verify PDF attachment

7. **View as Customer:**
   - Logout from admin
   - Login as customer who received order
   - Go to `/invoices`
   - Download your invoice

### 5.3 Check Database

```bash
# Connect to database
mysql -u your_user -p your_database

# Check what was created
SELECT * FROM invoices;
SELECT * FROM email_logs;
SELECT * FROM invoice_templates;
```

## Step 6: Common Issues & Fixes

### Issue: "No invoice generated yet" message
**Solution:**
- Make sure order exists in database
- Check backend logs for errors
- Verify Thymeleaf template path is correct

### Issue: PDF downloads but is blank
**Solution:**
- Check `/uploads/invoices/` directory permissions
- Verify Flying Saucer library is in classpath (check pom.xml)
- Review backend logs for Thymeleaf rendering errors

### Issue: Email not sending
**Solution:**
- Verify SMTP credentials in `.env.production`
- Check email address is valid format
- Review backend logs for JavaMailSender errors
- Check `email_logs` table for error_message field

### Issue: "Access Denied" on invoice pages
**Solution:**
- Verify user has ROLE_ADMIN or ROLE_STAFF
- Check permissions.ts includes `view_invoices` for user role
- Clear browser cache and login again

### Issue: Frontend shows 404 for invoice pages
**Solution:**
- Make sure App.tsx has routes added (should be already committed)
- Check invoiceService.ts is in correct path
- Rebuild frontend: `npm run build`

## Step 7: Check Logs

### Backend Logs
```bash
# Look for these successful logs:
# "Invoice generated successfully"
# "Email sent successfully"
# "Invoice template created"

# Look for these error logs:
# "Error generating invoice"
# "Error sending email"
# "Template not found"
```

### Frontend Console (DevTools)
1. Open `http://localhost:5173`
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for any red errors
5. Check Network tab for 4xx/5xx responses

## Step 8: Verify Database Records

```sql
-- Check if invoice was created
SELECT id, invoice_number, email_sent, email_sent_at
FROM invoices
ORDER BY created_at DESC
LIMIT 1;

-- Check if email log exists
SELECT id, email_type, recipient, success, error_message
FROM email_logs
WHERE email_type = 'INVOICE'
ORDER BY created_at DESC
LIMIT 1;

-- Check templates
SELECT template_id, name, template_type, active
FROM invoice_templates;
```

## Quick Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login as admin
- [ ] Invoice Templates page loads
- [ ] Can create new template
- [ ] Can see invoice section in order details
- [ ] Can generate invoice
- [ ] PDF file created in `/uploads/invoices/`
- [ ] PDF has correct content (order details, template styling)
- [ ] Can download PDF from admin
- [ ] Can send email (check inbox)
- [ ] Email log created in database
- [ ] Customer can view their invoices
- [ ] Search functionality works
- [ ] No console errors in browser DevTools

## Next Steps

If all tests pass:
1. Hook email triggers in backend (see Optional Integration section in summary)
2. Test with real Razorpay payments
3. Test across different browsers/devices
4. Load test with multiple invoices
5. Deploy to production with proper SMTP credentials

Need help? Check the detailed testing guide in `INVOICE_TESTING_GUIDE.md`
