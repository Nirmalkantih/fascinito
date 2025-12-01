# Firebase Phone Authentication Setup Guide

## Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click on **Settings** (gear icon) → **Project settings**
4. Scroll down to **Your apps** section
5. Click on the **Web** icon (`</>`) to add a web app
6. Register your app with a nickname (e.g., "POS Web App")
7. Copy the `firebaseConfig` object

## Step 2: Update Firebase Configuration

Open `/frontend/src/config/firebase.ts` and replace the configuration:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 3: Enable Phone Authentication in Firebase

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Phone** provider
3. Click **Enable** toggle
4. Click **Save**

## Step 4: Add Authorized Domains

1. Still in **Authentication** → **Sign-in method**
2. Scroll down to **Authorized domains**
3. Add your domains:
   - `localhost` (for development - should already be there)
   - Your production domain (e.g., `yourapp.com`)
4. Click **Add domain** if needed

## Step 5: Configure Test Phone Numbers (Optional for Testing)

For testing without using real phone numbers:

1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Expand **Phone numbers for testing**
3. Add test phone numbers with their verification codes:
   - Phone: `+91 1234567890`
   - Code: `123456`
4. Click **Add**

## Step 6: Set Up reCAPTCHA (Production)

For production, you may want to configure reCAPTCHA:

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Register a new site:
   - **Label**: Your app name
   - **reCAPTCHA type**: Choose v3 or v2 Invisible
   - **Domains**: Add your domain
3. Copy the **Site Key**
4. Update the reCAPTCHA verifier in your code if needed

## Step 7: Phone Number Format

Firebase requires phone numbers in **E.164 format**:
- Must start with `+` followed by country code
- No spaces, dashes, or parentheses
- Example formats:
  - India: `+919876543210`
  - USA: `+11234567890`
  - UK: `+447123456789`

## Step 8: Update Country Code in Code (if needed)

In `/frontend/src/pages/auth/Signup.tsx`, update the default country code:

```typescript
const formatPhoneForFirebase = (phone: string): string => {
  const cleaned = phone.replace(/\s/g, '')
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  // Change +91 to your default country code
  return '+91' + cleaned
}
```

Common country codes:
- India: `+91`
- USA: `+1`
- UK: `+44`
- Australia: `+61`
- Canada: `+1`

## Testing the Implementation

### Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/signup`

3. Enter user details with a valid phone number (with country code)

4. Click "Send OTP"

5. You should receive an SMS with a 6-digit code

6. Enter the code and complete signup

### Using Test Phone Numbers

If you configured test phone numbers:

1. Use the test phone number (e.g., `+911234567890`)
2. Firebase will NOT send an actual SMS
3. Use the predefined code you set up (e.g., `123456`)
4. This is perfect for development without incurring SMS costs

## Troubleshooting

### Error: "reCAPTCHA client element has been removed"
**Solution**: Make sure the `recaptcha-container` div exists in the DOM before initializing

### Error: "Invalid phone number"
**Solution**: Ensure the phone number is in E.164 format (+[country code][number])

### Error: "auth/invalid-app-credential"
**Solution**: Check that your Firebase config is correct and the app is registered in Firebase Console

### Error: "auth/too-many-requests"
**Solution**: Too many attempts. Wait a few minutes or use test phone numbers

### SMS not being received
**Solutions**:
1. Check that Phone auth is enabled in Firebase Console
2. Verify the phone number is correct and can receive SMS
3. Check Firebase Console → Usage to see if you've hit quota limits
4. Some countries/carriers may block automated SMS

## Firebase Pricing

- **Spark Plan (Free)**:
  - 10,000 phone verifications per month
  - Perfect for development and small apps

- **Blaze Plan (Pay as you go)**:
  - $0.06 per verification after free tier
  - Required for production apps with high volume

## Security Best Practices

1. **Never commit Firebase config to public repositories** if it contains sensitive data
2. **Enable App Check** in production to prevent abuse
3. **Set up usage quotas** in Firebase Console
4. **Monitor authentication logs** for suspicious activity
5. **Implement rate limiting** on your backend
6. **Use reCAPTCHA** to prevent bot abuse

## Additional Features You Can Add

1. **Multi-factor Authentication**: Add email as secondary verification
2. **Phone Number Verification on Profile Updates**: Re-verify when users change numbers
3. **Resend Limits**: Limit OTP resend attempts
4. **Timeout Handling**: Clear reCAPTCHA verifier after timeout
5. **Analytics**: Track OTP success/failure rates

## Environment Variables (Recommended)

Instead of hardcoding Firebase config, use environment variables:

Create `.env.local`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Update `firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## Next Steps

1. Update your Firebase configuration in `frontend/src/config/firebase.ts`
2. Test with a real phone number or test phone numbers
3. Monitor usage in Firebase Console
4. Add error tracking (Sentry, LogRocket, etc.)
5. Implement additional security measures for production
