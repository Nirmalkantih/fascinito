# Invoice & Email System - Testing Summary

## 📋 Quick Reference

### Testing Documentation Files
- **INVOICE_QUICK_START.md** - Start here! Quick 8-step manual testing workflow
- **INVOICE_TESTING_GUIDE.md** - Detailed testing guide with all scenarios and examples

---

## 🎯 What to Test

### Level 1: Quick Smoke Test (15 minutes)
Perfect for verifying basic functionality is working:

1. Start backend and frontend
2. Login as admin
3. Go to `/admin/invoice-templates`
4. Create a test template
5. Find an order in `/admin/orders`
6. Generate invoice in order details page
7. Download the PDF
8. Send email to customer
9. Check customer inbox for PDF
10. Login as customer and view `/invoices`

✅ **If all these work, the system is functional!**

### Level 2: Component Testing (45 minutes)
Test each feature in isolation:

#### Admin Invoice Templates Page
- [ ] Create template with all field types
- [ ] Edit template
- [ ] Delete template
- [ ] Search by template name
- [ ] Filter by template type (REGULAR, FESTIVAL, etc.)

#### Admin Invoices Management Page
- [ ] View list of all invoices
- [ ] Search by invoice number
- [ ] Search by customer name
- [ ] Download PDF file
- [ ] Preview invoice details in modal
- [ ] Resend email to customer
- [ ] Regenerate invoice

#### Customer Invoice Portal
- [ ] View own invoices list
- [ ] Download own invoice PDF
- [ ] Cannot access other customer's invoices
- [ ] Responsive design on mobile

#### Order Details Integration
- [ ] Invoice section appears on order details
- [ ] Generate invoice button works
- [ ] Download button works
- [ ] Send email button works
- [ ] Regenerate button works
- [ ] Email status updates correctly

### Level 3: Integration Testing (30 minutes)
Test complete workflows:

#### End-to-End Workflow
```
Create Order → Generate Invoice → Send Email → Customer Views
```

#### Database Consistency
- Verify `invoices` table has correct records
- Verify `email_logs` table tracks all sends
- Verify `invoice_templates` table has active templates

#### Email Verification
- Check email arrives in inbox
- Verify PDF attachment is correct
- Check email formatting and content

### Level 4: Edge Cases & Error Handling (20 minutes)
Test error scenarios:

- [ ] Generate invoice for non-existent order (404)
- [ ] Send email with invalid customer email (graceful error)
- [ ] Delete template while invoice uses it (error handling)
- [ ] Customer tries to access admin pages (403 Forbidden)
- [ ] Network error during PDF download (error toast)
- [ ] Regenerate invoice multiple times (counter increments)

---

## 🚀 How to Test

### Prerequisites
```bash
# 1. Backend running
cd backend && ./mvnw spring-boot:run

# 2. Frontend running
cd frontend && npm run dev

# 3. Database has tables (run SQL migrations from INVOICE_QUICK_START.md)

# 4. Environment configured (.env.production with SMTP credentials)
```

### Testing Steps

#### 1. Backend Validation
```bash
# Test API endpoints
curl http://localhost:8080/api/invoice-templates
curl http://localhost:8080/api/invoices/admin/all

# Check logs for errors
tail -f server.log
```

#### 2. Frontend Validation
```bash
# Check browser console for errors
DevTools → Console tab

# Check network requests
DevTools → Network tab → Filter XHR
```

#### 3. Email Validation
```bash
# Check email received
- Go to your test email inbox
- Look for subject: "Invoice from Fascinito"
- Download PDF attachment

# OR use mail testing service
- Use MailHog, Mailcatcher, or similar
- Set MAIL_HOST to localhost in .env
```

#### 4. Database Validation
```sql
-- Verify records created
SELECT COUNT(*) FROM invoices;
SELECT COUNT(*) FROM email_logs WHERE email_type = 'INVOICE';
SELECT COUNT(*) FROM invoice_templates WHERE active = true;
```

---

## ✅ Success Criteria

### Backend (API)
- [ ] All endpoints return correct HTTP status codes
- [ ] Invoice generation creates PDF file
- [ ] Email sending creates EmailLog record
- [ ] Permissions are enforced (@PreAuthorize)
- [ ] Error responses include meaningful messages

### Frontend (UI)
- [ ] All pages load without 404 errors
- [ ] Forms submit and create/update data
- [ ] Toast notifications show for all actions
- [ ] Pagination works with multiple records
- [ ] Search/filter functions work
- [ ] Responsive design on mobile (320px+)
- [ ] No console errors or warnings

### Integration
- [ ] Invoice generation workflow completes end-to-end
- [ ] Email delivery succeeds to customer inbox
- [ ] Customer can access their invoices
- [ ] Admin can manage all invoices
- [ ] Database state is consistent
- [ ] PDF content is accurate and formatted correctly

### Security
- [ ] Customers cannot access other customer's invoices
- [ ] Non-admin cannot access admin pages
- [ ] Permissions prevent unauthorized actions
- [ ] No sensitive data in logs/console

---

## 📊 Test Execution Plan

### Day 1: Quick Validation
- [ ] Run smoke test (15 min)
- [ ] Create sample invoices (10 min)
- [ ] Verify PDF generation (5 min)
- [ ] **Total: 30 minutes**

### Day 2: Component Testing
- [ ] Test each admin page (20 min)
- [ ] Test customer portal (10 min)
- [ ] Test order integration (10 min)
- [ ] **Total: 40 minutes**

### Day 3: Integration & Edge Cases
- [ ] Run complete workflows (20 min)
- [ ] Test error scenarios (15 min)
- [ ] Database verification (10 min)
- [ ] **Total: 45 minutes**

### Day 4: Production Readiness
- [ ] Load testing (10 invoices+)
- [ ] Cross-browser testing
- [ ] Mobile responsive testing
- [ ] Performance profiling
- [ ] **Total: 1 hour**

---

## 🐛 Debugging Quick Reference

### Frontend Issues

**Problem: Page shows 404**
```
→ Check App.tsx has routes imported
→ Verify component file exists at path
→ Clear browser cache (Ctrl+Shift+Delete)
```

**Problem: "Access Denied" message**
```
→ Verify user has correct role (ROLE_ADMIN/ROLE_STAFF)
→ Check permissions.ts has "view_invoices" for role
→ Logout and login again
```

**Problem: Form won't submit**
```
→ Open DevTools → Network tab
→ Look for failed API request
→ Check error response message
→ Verify backend is running
```

### Backend Issues

**Problem: Invoice PDF is blank**
```
→ Check /uploads/invoices/ directory exists
→ Verify pom.xml has flying-saucer dependencies
→ Check Thymeleaf template syntax in invoice-template.html
→ View backend logs for template rendering errors
```

**Problem: Email not sending**
```
→ Verify MAIL_HOST, MAIL_PORT in .env
→ Check MAIL_USERNAME, MAIL_PASSWORD are correct
→ View backend logs for JavaMailSender errors
→ Test SMTP connection manually
```

**Problem: 403 Forbidden on endpoints**
```
→ Verify user has token (check Authorization header)
→ Check @PreAuthorize annotation on controller method
→ Verify user has required role
→ Look for security filter logs
```

### Database Issues

**Problem: No invoices in list**
```sql
→ SELECT COUNT(*) FROM invoices;
→ Check order_id exists in orders table
→ Check user_id exists in users table
→ Verify invoice_template_id if not null
```

**Problem: Email logs show success:false**
```sql
→ SELECT * FROM email_logs WHERE success = false;
→ Check error_message column for details
→ Review recipient email format
→ Test SMTP credentials
```

---

## 📸 Visual Testing Checklist

### Admin Invoice Templates Page
```
[Add Template] [Search box] [Filter by type]

| Template ID | Name | Type | Active | Actions |
|---|---|---|---|---|
| ... | ... | ... | ✓/✗ | [Edit] [Delete] |
```

### Admin Invoices Management Page
```
[Search box] [Filter dropdown]

| Invoice # | Customer | Order # | Date | Status | Actions |
|---|---|---|---|---|---|
| INV-2024-00001 | John Doe | ORD-001 | 2024-01-15 | Sent | [👁] [⬇] [✉] [🔄] |
```

### Customer Invoice Portal
```
Your Invoices
[Search box] [Filters]

Card View (Desktop):
┌─────────────────┐
│ Invoice #INV... │
│ Order #ORD...   │
│ 2024-01-15      │
│ [Download]      │
└─────────────────┘

Table View (Mobile):
| Invoice # | Date | [Download] |
```

---

## 🎓 Learning Resources

If tests fail, check these resources:

1. **Backend Mail Configuration**
   - Spring Boot Email docs: https://spring.io/guides/gs/sending-email/
   - Flying Saucer PDF: https://xhtmlrenderer.java.net/

2. **Frontend React/Material-UI**
   - Material-UI docs: https://mui.com/
   - React hooks: https://react.dev/reference/react/hooks

3. **Database**
   - MySQL docs: https://dev.mysql.com/doc/
   - SQL queries: Run in database client

4. **Email Testing**
   - MailHog: https://github.com/mailhog/MailHog (local email testing)
   - Mailtrap: https://mailtrap.io/ (cloud email testing)

---

## ✨ After Testing - Next Steps

Once all tests pass:

1. **Commit your test results** with findings
2. **Hook email triggers** in backend (optional but recommended):
   - OrderService.updateOrderStatus() → sendOrderStatusUpdateEmail()
   - RazorpayService.verifyPayment() → sendPaymentSuccessEmail() + generateInvoice()
   - RefundService → sendRefundNotificationEmail()

3. **Deploy to staging** environment
4. **Real-world testing** with actual orders
5. **Performance tuning** if needed
6. **Deploy to production** with production SMTP credentials

---

## 📞 Support

If you encounter issues:

1. Check the error message in toast/console
2. Look up the error in INVOICE_TESTING_GUIDE.md
3. Check backend logs with full stack trace
4. Check database for missing data
5. Verify environment configuration
6. Clear cache and try again

Good luck with testing! 🚀
