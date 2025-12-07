# Razorpay Payment Integration Guide

This guide will help you integrate Razorpay payment gateway into your Fascinito POS application.

## 🎯 What's Been Integrated

✅ **Backend (Spring Boot)**
- Razorpay Java SDK (v1.4.6)
- Payment service for creating orders and verifying payments
- REST API endpoints for Razorpay operations
- Database support for Razorpay payment fields

✅ **Frontend (React + TypeScript)**
- Razorpay checkout integration
- Payment verification flow
- Enhanced checkout with multiple payment methods
- Error handling and user feedback

## 📋 Prerequisites

1. **Razorpay Account**: Sign up at [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
2. **API Keys**: Get your Test/Live keys from [https://dashboard.razorpay.com/app/keys](https://dashboard.razorpay.com/app/keys)

## 🚀 Setup Steps

### Step 1: Get Your Razorpay Credentials

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. Click **Generate Test Key** (for testing) or **Generate Live Key** (for production)
4. You'll receive:
   - **Key ID**: `rzp_test_xxxxxxxxx` or `rzp_live_xxxxxxxxx`
   - **Key Secret**: Keep this secret and never commit to Git!

### Step 2: Configure Backend

**Option A: Using Environment Variables (Recommended)**

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export RAZORPAY_KEY_ID=rzp_test_your_key_id_here
export RAZORPAY_KEY_SECRET=your_key_secret_here
export RAZORPAY_CURRENCY=INR
```

Then reload: `source ~/.zshrc`

**Option B: Using docker-compose.dev.yml**

Add to the `backend` service environment section:

```yaml
backend:
  environment:
    - RAZORPAY_KEY_ID=rzp_test_your_key_id_here
    - RAZORPAY_KEY_SECRET=your_key_secret_here
    - RAZORPAY_CURRENCY=INR
```

**Option C: Direct in application.yml (Not Recommended for Production)**

Edit `backend/src/main/resources/application.yml`:

```yaml
razorpay:
  key-id: rzp_test_your_key_id_here
  key-secret: your_key_secret_here
  currency: INR
```

⚠️ **IMPORTANT**: Never commit real credentials to Git!

### Step 3: Run Database Migration

The Payment entity has been updated with Razorpay fields. Restart your backend to apply changes:

```bash
cd /Users/nirmal/Fascinito
docker-compose -f docker-compose.dev.yml restart backend
```

Or if building from scratch:

```bash
./build.sh
```

### Step 4: Build and Deploy

```bash
# Build backend with Razorpay dependency
cd /Users/nirmal/Fascinito/backend
mvn clean package -DskipTests

# Rebuild and restart Docker containers
cd /Users/nirmal/Fascinito
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
```

### Step 5: Test the Integration

1. **Access the app**: http://localhost:3000 or http://localhost:5173
2. **Add products to cart**
3. **Go to checkout**
4. **Select "Razorpay" as payment method**
5. **Complete the order**
6. **Razorpay checkout will open** with test payment options

## 🧪 Testing with Razorpay Test Mode

### Test Cards

| Card Number         | CVV | Expiry   | Description           |
|---------------------|-----|----------|-----------------------|
| 4111 1111 1111 1111 | Any | Any      | Success               |
| 5555 5555 5555 4444 | Any | Any      | Success               |
| 4000 0000 0000 0002 | Any | Any      | Card declined         |
| 4000 0025 0000 3155 | Any | Any      | Authentication failed |

### Test UPI

- UPI ID: `success@razorpay`
- This will simulate a successful UPI payment

### Test Wallets

- Select any wallet in test mode
- Payment will be simulated as successful

## 📱 Payment Flow

```
User adds items to cart
       ↓
User proceeds to checkout
       ↓
User fills shipping/billing address
       ↓
User selects "Razorpay" payment method
       ↓
User clicks "Place Order"
       ↓
Backend creates order with PENDING status
       ↓
Backend creates Razorpay order
       ↓
Frontend displays Razorpay checkout modal
       ↓
User completes payment
       ↓
Razorpay sends payment details to frontend
       ↓
Frontend sends verification request to backend
       ↓
Backend verifies signature using HMAC SHA256
       ↓
If valid: Order status → CONFIRMED
       ↓
Cart cleared, user redirected to success page
```

## 🔒 Security Features

✅ **Server-side signature verification** using HMAC SHA256
✅ **Secure key storage** using environment variables
✅ **No sensitive data in frontend**
✅ **Transaction ID tracking**
✅ **Payment status management**

## 🌐 API Endpoints

### Create Razorpay Order
```
POST /api/payment/razorpay/create-order/{orderId}
Headers: Authorization: Bearer <token>
Response: { orderId, amount, currency, keyId, ... }
```

### Verify Payment
```
POST /api/payment/razorpay/verify
Headers: Authorization: Bearer <token>
Body: {
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  orderId: number
}
Response: { success: boolean, message: string, ... }
```

### Handle Payment Failure
```
POST /api/payment/razorpay/failure/{orderId}
Headers: Authorization: Bearer <token>
Body: "Reason for failure"
```

## 🔄 Moving from Test to Live Mode

1. **Generate Live API Keys** from Razorpay Dashboard
2. **Update environment variables**:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_your_live_key_id
   RAZORPAY_KEY_SECRET=your_live_key_secret
   ```
3. **Activate your account** on Razorpay Dashboard
4. **Submit KYC documents** (required for live mode)
5. **Test thoroughly** before going live
6. **Monitor transactions** on Razorpay Dashboard

## 📊 Database Schema

New fields added to `payments` table:

```sql
ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN razorpay_signature VARCHAR(100);
```

New payment methods added to `payment_method` enum:
- `RAZORPAY`
- `UPI`
- `NET_BANKING`
- `WALLET`

## 🐛 Troubleshooting

### Issue: "Razorpay SDK failed to load"
**Solution**: Check your internet connection. The Razorpay script loads from CDN.

### Issue: "Invalid signature"
**Solution**: 
- Verify your Key Secret is correct
- Check that the order ID matches
- Ensure no middleware is modifying the request

### Issue: "Order not found"
**Solution**: Ensure the order was created successfully before initiating payment

### Issue: Payment succeeds but order not confirmed
**Solution**: Check backend logs for verification errors. Ensure signature verification is working.

## 📞 Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Razorpay Support**: support@razorpay.com
- **Integration Guide**: https://razorpay.com/docs/payment-gateway/web-integration/

## ⚠️ Important Notes

1. **Never commit API keys to Git**
2. **Always verify payments on server-side**
3. **Test thoroughly in Test Mode before going Live**
4. **Keep Razorpay SDK updated**
5. **Monitor failed payments in Dashboard**
6. **Set up webhooks for reliable payment tracking** (optional advanced feature)

## 🎉 You're Ready!

Your Razorpay integration is complete. Test it out and watch transactions in your Razorpay Dashboard!

Remember to:
- Start with Test Mode
- Use test cards for testing
- Move to Live Mode only after thorough testing
- Keep your API keys secure

Happy selling! 💰
