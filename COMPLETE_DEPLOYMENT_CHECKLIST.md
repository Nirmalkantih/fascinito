# 🔐 Complete Environment Variables Checklist

## 📋 Backend Environment Variables (Render.com)

Add these **22 environment variables** in Render Dashboard:

### Database Configuration
```
DB_HOST = srv1002.hstgr.io
DB_PORT = 3306
DB_NAME = u670443918_Fascinito_pos
DB_USER = u670443918_Fascinito_pos
DB_PASSWORD = Fascinito123!
```

### Server Configuration
```
SERVER_PORT = 8080
```

### JWT Configuration
```
JWT_SECRET = zHpD5CEj8eiZVbGqcY7JNyY9p/fTlrYxLlQbGJ3KXQEkLwCExVyDBBmtB6PCOGVctor18vtVTOJVQfqi6dZU1Q==
JWT_ACCESS_EXPIRATION = 3600000
JWT_REFRESH_EXPIRATION = 604800000
```

### CORS Configuration
```
CORS_ORIGINS = https://fascinito.in,https://www.fascinito.in
```

### File Upload Configuration
```
UPLOAD_BASE_PATH = /var/data/uploads
```

### Razorpay Configuration
```
RAZORPAY_KEY_ID = rzp_test_your_test_key
RAZORPAY_KEY_SECRET = your_test_secret
RAZORPAY_CURRENCY = INR
```
⚠️ **Replace with LIVE keys after testing!**

### Logging Configuration
```
LOG_LEVEL = INFO
SHOW_SQL = false
```

### Spring Profiles
```
SPRING_PROFILES_ACTIVE = production
```

### Firebase Configuration (Documentation Only - Not Used by Backend)
```
FIREBASE_API_KEY = AIzaSyAFOjw6r-l6TWmSppqDER-9xUKCqSNtnGM
FIREBASE_AUTH_DOMAIN = fascinito-fas.firebaseapp.com
FIREBASE_PROJECT_ID = fascinito-fas
FIREBASE_STORAGE_BUCKET = fascinito-fas.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = 561159322004
FIREBASE_APP_ID = 1:561159322004:web:41f2cd575d2c94eb577781
FIREBASE_MEASUREMENT_ID = G-88VBQJHE57
```
ℹ️ Note: Backend only validates Firebase tokens, doesn't need these credentials

---

## 🌐 Frontend Environment Variables (Hostinger)

Create `frontend/.env.production` with these **11 variables**:

### Backend API
```
VITE_API_URL = https://fascinito-backend.onrender.com/api
```
⚠️ **Update with your actual Render.com URL after deployment!**

### Firebase Configuration (OTP Authentication)
```
VITE_FIREBASE_API_KEY = AIzaSyAFOjw6r-l6TWmSppqDER-9xUKCqSNtnGM
VITE_FIREBASE_AUTH_DOMAIN = fascinito-fas.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = fascinito-fas
VITE_FIREBASE_STORAGE_BUCKET = fascinito-fas.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 561159322004
VITE_FIREBASE_APP_ID = 1:561159322004:web:41f2cd575d2c94eb577781
VITE_FIREBASE_MEASUREMENT_ID = G-88VBQJHE57
```

### Razorpay Configuration
```
VITE_RAZORPAY_KEY_ID = rzp_test_your_test_key
```
⚠️ **Replace with LIVE key after testing!**

### reCAPTCHA Configuration
```
VITE_RECAPTCHA_SITE_KEY = 6LdLCyQsAAAAAKFPSiV3HIMYz8vDjNEbEE17mLqn
```

### Application Configuration
```
VITE_APP_NAME = Fascinito
VITE_APP_VERSION = 1.0.0
VITE_ENVIRONMENT = production
```

---

## ✅ Deployment Checklist

### 1️⃣ Backend Deployment (Render.com)

- [ ] **Enable Hostinger Remote MySQL**
  - Login to Hostinger Control Panel
  - Navigate to: Databases → Remote MySQL
  - Add allowed host: `%` (or specific Render IPs)
  - Verify hostname: `srv1002.hstgr.io`

- [ ] **Create Render Web Service**
  - Go to: https://dashboard.render.com
  - New + → Web Service
  - Connect GitHub: `Nirmalkantih/fascinito`
  - Configure:
    - Name: `fascinito-backend`
    - Root Directory: `backend`
    - Runtime: `Java`
    - Build Command: `mvn clean package -DskipTests`
    - Start Command: `java -jar target/pos-backend-1.0.0.jar`
    - Instance Type: `Free`

- [ ] **Add Environment Variables**
  - Copy all 22 variables from backend section above
  - Paste in Render Dashboard → Environment

- [ ] **Add Persistent Disk**
  - Name: `uploads`
  - Mount Path: `/var/data/uploads`
  - Size: `1 GB`

- [ ] **Deploy**
  - Click "Create Web Service"
  - Wait 5-10 minutes
  - Copy the URL (e.g., `https://fascinito-backend.onrender.com`)

### 2️⃣ Frontend Deployment (Hostinger)

- [ ] **Update Frontend Configuration**
  - Open `frontend/.env.production`
  - Update `VITE_API_URL` with your Render backend URL
  - Verify all Firebase variables are present

- [ ] **Build Frontend**
  ```bash
  cd frontend
  npm run build
  ```

- [ ] **Upload to Hostinger**
  - Upload contents of `frontend/dist/` to `/public_html/`
  - Create `.htaccess` for React Router:
    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteCond %{REQUEST_FILENAME} !-l
      RewriteRule . /index.html [L]
    </IfModule>
    ```

### 3️⃣ Testing & Verification

- [ ] **Test Backend**
  ```bash
  curl https://fascinito-backend.onrender.com/api/health
  curl https://fascinito-backend.onrender.com/api/categories
  ```

- [ ] **Test Frontend**
  - Visit: https://fascinito.in
  - Check browser console for errors
  - Test OTP login with phone number
  - Verify products load correctly
  - Test add to cart functionality

- [ ] **Test Phone OTP Login**
  - Click "Login with Phone"
  - Enter valid Indian phone number
  - Verify OTP received (Firebase)
  - Complete login process
  - Check JWT token in localStorage

- [ ] **Test Payment (with test keys)**
  - Add products to cart
  - Proceed to checkout
  - Use Razorpay test card: `4111 1111 1111 1111`
  - Verify order creation

### 4️⃣ Production Ready

- [ ] **Switch to Live Razorpay Keys**
  - Get keys from: https://dashboard.razorpay.com/app/keys
  - Update in Render Dashboard (backend)
  - Update in `frontend/.env.production`
  - Rebuild and redeploy frontend

- [ ] **Configure Domain SSL**
  - Ensure HTTPS is enabled in Hostinger
  - Verify SSL certificate is valid
  - Test www redirect

- [ ] **Set Up Monitoring**
  - Enable Render metrics dashboard
  - Set up uptime monitoring (e.g., UptimeRobot)
  - Configure error alerting

---

## 🚨 Important Notes

### Firebase OTP
- ✅ Firebase credentials are **public** (safe to expose in frontend)
- ✅ Backend validates Firebase ID tokens (doesn't need Firebase credentials)
- ✅ OTP authentication works entirely through Firebase Auth SDK

### Security
- 🔒 Never expose `JWT_SECRET` in frontend
- 🔒 Never expose `RAZORPAY_KEY_SECRET` in frontend
- 🔒 Never expose `DB_PASSWORD` in frontend
- ✅ Frontend only needs public-facing keys

### CORS
- Backend CORS is configured for: `https://fascinito.in`, `https://www.fascinito.in`
- If you add more domains, update `CORS_ORIGINS` in Render

### Database
- Remote MySQL is enabled for: `srv1002.hstgr.io`
- Ensure Render IPs are whitelisted in Hostinger
- Connection string: `jdbc:mysql://srv1002.hstgr.io:3306/u670443918_Fascinito_pos`

---

## 📞 Support

If you encounter issues:

1. **Check Render Logs**: Dashboard → Your Service → Logs
2. **Check Browser Console**: F12 → Console tab
3. **Verify Environment Variables**: Render Dashboard → Environment
4. **Test Database Connection**: Use MySQL client to verify remote access
5. **Check CORS**: Ensure frontend domain is in `CORS_ORIGINS`

---

**Last Updated**: 14 December 2025
**Backend**: Render.com (Free Tier with cold starts)
**Frontend**: Hostinger
**Database**: Hostinger MySQL (Remote Access)
**Domain**: https://fascinito.in
