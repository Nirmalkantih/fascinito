# Invoice & Email Notification System - Testing Guide

## Prerequisites
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:5173`
- Database migrations completed for new invoice tables
- SMTP email credentials configured in `.env.production`
- Admin user account with ROLE_ADMIN or ROLE_STAFF
- Test customer account created

---

## Phase 1: Backend Endpoint Testing

### 1.1 Invoice Template Management

#### Test: Create Invoice Template
```bash
curl -X POST http://localhost:8080/api/invoice-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "templateId": "template-regular-1",
    "name": "Regular Invoice",
    "description": "Standard invoice template",
    "templateType": "REGULAR",
    "subject": "Your Invoice #{{invoiceNumber}}",
    "headerColor": "#667eea",
    "footerNote": "Thank you for your business!",
    "logoUrl": "https://your-domain.com/logo.png",
    "bannerUrl": "https://your-domain.com/banner.png",
    "showFestivalBanner": false,
    "active": true
  }'
```

Expected Response: `200 OK` with created template object including auto-generated ID

#### Test: List Active Templates
```bash
curl -X GET http://localhost:8080/api/invoice-templates/active \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `200 OK` with array of active templates

#### Test: Update Template
```bash
curl -X PUT http://localhost:8080/api/invoice-templates/{templateId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name": "Updated Name", "active": true}'
```

Expected Response: `200 OK` with updated template

#### Test: Delete Template
```bash
curl -X DELETE http://localhost:8080/api/invoice-templates/{templateId} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `204 No Content`

---

### 1.2 Invoice Generation

#### Test: Generate Invoice
```bash
curl -X POST http://localhost:8080/api/invoices/generate/{orderId} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `200 OK` with invoice object containing:
- `invoiceNumber` (format: INV-YYYY-XXXXX)
- `filePath` (file saved location)
- `fileUrl` (download URL)
- `generatedAt` timestamp
- `emailSent: false`

#### Test: Verify PDF File Created
- Navigate to backend `/uploads/invoices/` directory
- Verify PDF file exists with naming pattern: `invoice-{invoiceId}.pdf`
- Open PDF to verify content (logo, template styling, order details, itemized products)

#### Test: Get Invoice by Order
```bash
curl -X GET http://localhost:8080/api/invoices/{orderId} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `200 OK` with invoice details

#### Test: Regenerate Invoice
```bash
curl -X POST http://localhost:8080/api/invoices/{invoiceId}/regenerate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `200 OK` with updated invoice
- `regeneratedCount` incremented
- New PDF file generated
- `generatedAt` updated to current timestamp

---

### 1.3 Email Service Testing

#### Test: Send Invoice Email
```bash
curl -X POST http://localhost:8080/api/invoices/{invoiceId}/resend-email \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `200 OK`

#### Verify Email Delivery
1. Check email inbox (test customer email address)
2. Verify email contains:
   - Subject: Invoice from template
   - PDF attachment: invoice PDF
   - HTML formatted body with order details
   - Footer with company info

#### Check Email Logs
```bash
curl -X GET http://localhost:8080/api/email-logs?type=INVOICE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `200 OK` with email log entries showing:
- `emailType: "INVOICE"`
- `recipient: "customer@example.com"`
- `success: true` or `false`
- `errorMessage` (if failed)
- `createdAt` timestamp

---

## Phase 2: Frontend Component Testing

### 2.1 Navigation & Routing

#### Test: Admin Menu Items Visible
1. Login as admin user
2. Go to `/admin/dashboard`
3. Check sidebar menu - should see:
   - "Invoice Templates" menu item
   - "Invoices" menu item

#### Test: Route Access
1. Try accessing `/admin/invoice-templates` directly
2. Try accessing `/admin/invoices` directly
3. Try accessing `/invoices` as customer user
- All should load without 404 errors

#### Test: Permission Denied
1. Login as customer user
2. Try accessing `/admin/invoice-templates`
3. Should see "Access Denied" message

---

### 2.2 Invoice Templates Admin Page

#### Test: Load Templates Page
1. Navigate to `/admin/invoice-templates`
2. Verify page loads with table of templates
3. Verify pagination works if multiple templates exist

#### Test: Create New Template
1. Click "Add Template" button
2. Fill form:
   - Template ID: `test-template-1`
   - Name: `Test Festival Template`
   - Template Type: `FESTIVAL`
   - Subject: `Festival Invoice`
   - Header Color: Pick a color using color picker
   - Footer Note: `Happy Diwali!`
   - Show Festival Banner: Toggle ON
3. Click Save
4. Verify:
   - Toast notification: "Template created successfully"
   - Template appears in list with correct type badge color

#### Test: Edit Template
1. Click Edit on an existing template
2. Change name to `Updated Template Name`
3. Click Save
4. Verify:
   - Toast notification: "Template updated successfully"
   - Table reflects name change

#### Test: Search Templates
1. Type in search box: `festival`
2. Verify table filters to show only FESTIVAL type templates
3. Clear search - all templates should appear again

#### Test: Delete Template
1. Click Delete on a template
2. Confirm deletion in dialog
3. Verify:
   - Toast notification: "Template deleted successfully"
   - Template removed from list

---

### 2.3 Admin Invoices Management Page

#### Test: Load Invoices Page
1. Navigate to `/admin/invoices`
2. Verify page loads with list of invoices
3. Verify pagination (if 10+ invoices exist)

#### Test: Search Invoices
1. Type in search box: `INV-` (invoice number prefix)
2. Verify results filter
3. Search by customer name
4. Search by customer email
5. Clear search to show all

#### Test: Download Invoice PDF
1. Click "Download" button on any invoice
2. Verify PDF downloads with proper filename
3. Open PDF and verify:
   - Invoice number matches table
   - Order details correct
   - Itemized products list
   - Price breakdown
   - Company logo and styling

#### Test: Preview Invoice
1. Click "Preview" icon on invoice row
2. Modal opens showing:
   - Invoice Number
   - Order details
   - Customer info
   - Template name
   - Generation date
   - Email sent status

#### Test: Resend Email
1. Find invoice with `emailSent: false`
2. Click "Resend Email" button
3. Verify:
   - Toast: "Email sent successfully"
   - Email status updates to "Sent on [date]"
   - Email received by customer

#### Test: Regenerate Invoice
1. Click "Regenerate" button on invoice
2. Verify:
   - Toast: "Invoice regenerated successfully"
   - Generated date updates
   - PDF can be re-downloaded
   - Content matches current order status

---

### 2.4 Customer Invoice Portal

#### Test: Load Customer Invoices Page
1. Login as customer user
2. Navigate to `/invoices` or click "Invoices" in customer menu
3. Verify page loads with their invoices
4. On desktop: verify card layout
5. On mobile: verify table layout responsive

#### Test: Download Own Invoice
1. Click "Download" button on their invoice
2. Verify PDF downloads
3. Verify content matches what they ordered

#### Test: No Access to Other Invoices
1. As customer, try accessing another customer's invoice via direct URL
2. Should get `403 Forbidden` or similar error

---

### 2.5 Order Details Page Integration

#### Test: Invoice Section Appears
1. Navigate to admin order details page: `/admin/orders/{orderId}`
2. Scroll down to "Invoice" section
3. If no invoice generated:
   - See message: "No invoice generated yet"
   - See "Generate Invoice" button

#### Test: Generate From Order Details
1. Click "Generate Invoice" button
2. Verify:
   - Toast: "Invoice generated successfully"
   - Invoice section updates with:
     - Invoice Number
     - Template name
     - Generated Date
     - Email status (Not sent)
   - Buttons change to: Download PDF, Regenerate, Send Email

#### Test: Download from Order Details
1. Click "Download PDF" button
2. Verify PDF downloads with correct invoice number

#### Test: Send Email from Order Details
1. Click "Send Email" button
2. Verify:
   - Toast: "Email sent successfully"
   - Email Status updates to "Sent on [date]"
   - Button disappears (only appears when emailSent=false)

#### Test: Regenerate from Order Details
1. Click "Regenerate" button
2. Verify:
   - Toast: "Invoice regenerated successfully"
   - Generated date updates
   - PDF content reflects any order changes

---

## Phase 3: Integration Testing

### 3.1 End-to-End Invoice Workflow

1. **Create Order:**
   - Login as customer
   - Add products to cart
   - Proceed to checkout
   - Complete payment via Razorpay
   - Verify order is created with status "CONFIRMED"

2. **Admin Generates Invoice:**
   - Login as admin
   - Go to order details page
   - Click "Generate Invoice"
   - Verify invoice created with proper number format
   - Verify PDF file exists on server

3. **Send Invoice Email:**
   - Still on order details page
   - Click "Send Email"
   - Check customer email inbox
   - Verify PDF attachment and formatting

4. **Customer Views Invoice:**
   - Login as customer who received order
   - Navigate to `/invoices`
   - Find order invoice in list
   - Click Download to verify PDF

5. **Admin Tracks Invoice:**
   - Go to `/admin/invoices`
   - Search for customer name or invoice number
   - Verify invoice appears with correct status
   - Verify email sent status shows "Sent on [date]"

### 3.2 Email Log Verification

1. Check email logs table in database:
   ```sql
   SELECT * FROM email_logs WHERE email_type = 'INVOICE' ORDER BY created_at DESC;
   ```

2. Verify fields:
   - `email_type`: INVOICE
   - `recipient`: customer email
   - `subject`: matches template subject
   - `success`: true (for successful sends)
   - `created_at`: recent timestamp
   - `invoice_id`: matches invoice ID

### 3.3 Database State Verification

```sql
-- Check invoices table
SELECT id, invoice_number, email_sent, email_sent_at, regenerated_count FROM invoices ORDER BY created_at DESC;

-- Check invoice templates
SELECT id, template_id, name, template_type, active FROM invoice_templates;

-- Check email logs
SELECT id, email_type, recipient, success, error_message FROM email_logs WHERE email_type = 'INVOICE' ORDER BY created_at DESC;
```

---

## Phase 4: Error Handling & Edge Cases

### 4.1 Invalid Requests

#### Test: Generate Invoice for Non-existent Order
```bash
curl -X POST http://localhost:8080/api/invoices/generate/99999 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `404 Not Found` with error message

#### Test: Regenerate Non-existent Invoice
```bash
curl -X POST http://localhost:8080/api/invoices/99999/regenerate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response: `404 Not Found` with error message

### 4.2 Permission Testing

#### Test: Customer Cannot Generate Invoice
1. Login as customer
2. Try POST to `/api/invoices/generate/{orderId}`
3. Should get `403 Forbidden`

#### Test: Customer Cannot Manage Templates
1. Login as customer
2. Try POST to `/api/invoice-templates`
3. Should get `403 Forbidden`

### 4.3 File System Testing

1. Verify permissions on `/uploads/invoices/` directory
2. Verify PDF files have correct ownership
3. Verify PDF files are not deleted when invoice is deleted (soft delete concept)
4. Verify PDF filename matches invoice ID for uniqueness

### 4.4 Email Failure Scenarios

#### Test: Invalid Email Address
1. Update customer email to invalid format in database
2. Try sending invoice email
3. Verify:
   - Error caught in EmailService
   - EmailLog created with `success: false`
   - `error_message` contains error details
   - No exception thrown to API caller

#### Test: SMTP Connection Issues
1. Temporarily misconfigure SMTP credentials in `.env`
2. Try sending email
3. Verify:
   - Graceful error handling
   - Toast shows error message
   - Application doesn't crash

---

## Testing Checklist

### Backend Tests ✓
- [ ] Create template (POST)
- [ ] List templates (GET)
- [ ] Update template (PUT)
- [ ] Delete template (DELETE)
- [ ] Generate invoice (POST)
- [ ] Get invoice by order (GET)
- [ ] Regenerate invoice (POST)
- [ ] Resend invoice email (POST)
- [ ] Verify PDF file creation
- [ ] Check email logs
- [ ] Test permission guards (@PreAuthorize)

### Frontend Tests ✓
- [ ] Admin menu shows invoice items
- [ ] Route access for admin pages
- [ ] Route access for customer page
- [ ] Permission denied messages
- [ ] Create template form works
- [ ] Edit template works
- [ ] Delete template works
- [ ] Search templates works
- [ ] List invoices with pagination
- [ ] Search invoices works
- [ ] Download invoice PDF
- [ ] Preview invoice details
- [ ] Resend email from admin page
- [ ] Regenerate from admin page
- [ ] Customer portal shows own invoices
- [ ] Download from customer portal
- [ ] Order details invoice section
- [ ] Generate from order details
- [ ] Send email from order details
- [ ] Regenerate from order details

### Integration Tests ✓
- [ ] End-to-end order to invoice workflow
- [ ] Email delivery to customer inbox
- [ ] Email logs created correctly
- [ ] Database state is consistent
- [ ] PDF content accuracy
- [ ] Error handling for missing data
- [ ] Permission enforcement

---

## Debugging Tips

### View Backend Logs
```bash
# If running with Docker
docker logs {container_id} -f

# If running locally
# Check console output where Spring Boot is running
```

### Check Email Logs in Browser
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by XHR requests
4. Look for `/api/invoices/**` requests
5. Check Response payload for errors

### Database Inspection
```bash
# Connect to your database
mysql -u user -p database_name

# Check invoice tables
DESCRIBE invoices;
DESCRIBE invoice_templates;
DESCRIBE email_logs;
```

### PDF Generation Debugging
1. Check `/uploads/invoices/` directory exists
2. Verify PDF file was created after invoice generation
3. If blank PDF: check Thymeleaf template path
4. If styling issues: check CSS in HTML template

### Email Debugging
1. Check email credentials in `.env.production`
2. Verify SMTP server settings (host, port, TLS/SSL)
3. Check MAIL_USERNAME and MAIL_PASSWORD are correct
4. Look for warnings in Spring Boot logs about mail configuration

---

## Success Criteria

When all tests pass:
- ✅ Invoices generate with correct PDF content
- ✅ Emails deliver to customers with PDF attachments
- ✅ Admin can manage templates and invoices
- ✅ Customers can view and download their invoices
- ✅ Email logs track all delivery attempts
- ✅ Permissions prevent unauthorized access
- ✅ Error handling gracefully handles failures
- ✅ Responsive UI works on desktop and mobile
