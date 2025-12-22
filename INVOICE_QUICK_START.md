# Invoice Feature - Quick Start (5 Minutes)

## ⚡ The Most Important Thing to Know

### **Emails are NOT automatic!**

When you generate an invoice, **ONLY the PDF is created**. To send an email:

```
Step 1: Generate Invoice  →  Step 2: Send Email
POST /generate/1          →  POST /resend-email/1
```

---

## 🎯 3-Step Quick Start

### **Step 1: Create a Template** (One time)
Go to Admin Dashboard → Invoice Templates → Create
```
Name: My Invoice Template
Subject: Your Invoice from Fascinito
Footer: Thank you for shopping!
Active: ✓ Yes
```

### **Step 2: Generate Invoice**
Find order → Click "Generate Invoice" button
OR API:
```bash
curl -X POST http://localhost:8080/api/invoices/generate/1 \
  -H "Authorization: Bearer {TOKEN}"
```

### **Step 3: Send Email to Customer**
Find invoice → Click "Send Email" button
OR API:
```bash
curl -X POST http://localhost:8080/api/invoices/1/resend-email \
  -H "Authorization: Bearer {TOKEN}"
```

✅ Customer receives invoice PDF in email

---

## 📊 Where Everything Is

### Admin Pages
```
Admin Dashboard
├── Invoice Templates (manage templates)
│   └── Create, Edit, Delete, Activate
└── Invoices (manage generated invoices)
    ├── View all invoices
    ├── Download PDF
    ├── Regenerate (new design)
    └── Resend Email
```

### Customer Pages
```
Customer Portal
└── My Invoices
    ├── View my invoices
    └── Download PDF
```

---

## 📧 Email Delivery

### **How Emails Are Sent**
1. **Non-blocking** - Response returns immediately
2. **Async** - Processed in background thread
3. **Logged** - All email attempts recorded in `email_logs` table
4. **Attachment** - PDF automatically attached

### **Email Configuration**
Emails configured to send from: `noreply@fascinito.in`
Check `application.yml` for SMTP settings

---

## 🔑 API Endpoints Quick Reference

| Action | Endpoint | Method | Role |
|--------|----------|--------|------|
| Generate | `/api/invoices/generate/{orderId}` | POST | ADMIN, STAFF |
| Send Email | `/api/invoices/{invoiceId}/resend-email` | POST | ADMIN, STAFF |
| Regenerate | `/api/invoices/{invoiceId}/regenerate` | POST | ADMIN, STAFF |
| Download | `/api/invoices/{invoiceId}/download` | GET | ANY |
| View All (Admin) | `/api/invoices/admin/all` | GET | ADMIN, STAFF |
| View My Invoices | `/api/invoices/my-invoices` | GET | CUSTOMER |

---

## 🎨 Template Types

```
REGULAR      → Standard business invoice
FESTIVAL     → Festival/holiday themed (with banner)
PROMOTIONAL  → Special offer/discount themed
VIP          → Premium/premium customer invoice
```

Each template can have:
- Custom colors
- Logo image
- Festival banner
- Custom footer message
- Email subject line

---

## 📋 Common Scenarios

### **Scenario 1: Order Received → Send Invoice**
```
1. Customer places order (Order ID = 1)
2. Admin clicks "Generate Invoice"
3. Admin clicks "Send Email"
4. Customer gets email with PDF
```

### **Scenario 2: Change Design → Regenerate**
```
1. Invoice already exists
2. Create new template with new colors
3. Go to invoice → Click "Regenerate"
4. PDF recreated with new design
5. Click "Send Email" to resend to customer
```

### **Scenario 3: Customer Views Invoices**
```
1. Customer logs in
2. Go to "My Invoices"
3. Click "Download" on any invoice
4. PDF downloads to computer
```

---

## ❌ Common Mistakes

| ❌ Mistake | ✅ Correct Way |
|-----------|-------------|
| Invoice generated = email sent | Generate first, THEN send email |
| Click only "Generate" button | Must click "Generate" AND "Send Email" |
| Email auto-sent on order | Only manual trigger via button/API |
| Email sent to wrong address | Check customer email in user profile |

---

## 📊 What Gets Stored

When you generate an invoice:

```
Database (invoices table):
├── invoiceNumber: INV-2025-00001
├── orderId: 1
├── filePath: /uploads/invoices/INV-2025-00001.pdf
├── emailSent: false  ← Changes to true after email
├── generatedAt: 2025-12-22 10:35:30
└── regeneratedCount: 0

Filesystem:
└── /uploads/invoices/
    └── INV-2025-00001.pdf
```

---

## 🔍 How to Check Email Status

### **Option 1: Admin Dashboard**
Invoices list → Check "Email Sent" column

### **Option 2: Database**
```sql
SELECT invoice_number, email_sent, email_sent_at
FROM invoices
WHERE id = 1;
```

### **Option 3: Email Logs**
```sql
SELECT * FROM email_logs
WHERE invoice_id = 1
ORDER BY sent_at DESC;
```

---

## 🚀 Performance

✅ **Invoice Generation:** ~500ms (includes PDF creation)
✅ **Email Sending:** Instant response + background processing
✅ **Concurrent Emails:** Can handle 100 emails in queue simultaneously

---

## 🆘 Troubleshooting

### Email Not Received?
1. Check email address in customer profile
2. Check spam folder
3. Verify SMTP credentials in `application.yml`
4. Check `email_logs` table for error messages

### Invoice PDF Not Created?
1. Check `/uploads/invoices/` directory exists
2. Verify write permissions
3. Check backend logs for errors

### Invoice Generation Fails?
1. Verify order exists (ID = 1)
2. Check order has user assigned
3. Check order has items

---

## 📚 For More Details

See complete guide: [INVOICE_FEATURE_GUIDE.md](./INVOICE_FEATURE_GUIDE.md)

---

## Summary

```
┌─────────────────────────────────────────┐
│  INVOICE FEATURE FLOW                   │
├─────────────────────────────────────────┤
│                                         │
│  Generate Invoice    Email Sent         │
│       ↓                  ↓              │
│  PDF Created → Logged  Customer Gets    │
│              in DB    Email with PDF    │
│                                         │
│  Manual Steps:                          │
│  1️⃣  Generate (click button)           │
│  2️⃣  Send Email (click button)         │
│                                         │
│  ⏱️  Response time: <1 second          │
│  📧 Email processing: Background       │
│                                         │
└─────────────────────────────────────────┘
```

---

**Remember:** Invoice generation ≠ Email sending. You must trigger email sending separately!
