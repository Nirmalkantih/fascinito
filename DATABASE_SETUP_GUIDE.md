# 🗄️ Database Configuration Guide

## 📋 Overview

Your application is configured to support **both MySQL and PostgreSQL**:

- **Local Development**: MySQL
- **Production (Render)**: PostgreSQL

---

## 🏠 Local Development (MySQL)

### **Configuration**

The application uses MySQL by default when no `DATABASE_URL` is set.

**Default Settings:**
```yaml
url: jdbc:mysql://localhost:3306/pos_db
username: root
password: password
dialect: org.hibernate.dialect.MySQLDialect
```

### **Using Docker Compose**

```bash
# Start MySQL locally
docker-compose up -d

# Your app will connect to:
# Host: localhost
# Port: 3306
# Database: pos_db
```

### **Custom Local Config**

Create `.env.local` (gitignored):
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

---

## ☁️ Production (Render PostgreSQL)

### **Configuration**

When deployed to Render, the app uses PostgreSQL via `DATABASE_URL`.

**Environment Variables for Render:**

```env
DATABASE_URL=postgresql://postgres:baNNYGwXLgEgt4747PuPHoV9Ng68CTnd@dpg-xxxxx.render.com:5432/fascinito_pos
HIBERNATE_DIALECT=org.hibernate.dialect.PostgreSQLDialect
```

### **How It Works**

1. **Spring Boot detects `DATABASE_URL`** environment variable
2. **Overrides the default MySQL connection**
3. **Uses PostgreSQL driver** (already in `pom.xml`)
4. **Sets PostgreSQL dialect** via `HIBERNATE_DIALECT`

---

## 🚀 Deployment Steps for Render

### **1. Create PostgreSQL Database on Render**

1. Go to Render Dashboard: https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   ```
   Name: fascinito-database
   Database: fascinito_pos
   User: postgres (default)
   Region: Singapore (same as backend)
   Plan: Free
   ```
4. Click **"Create Database"**
5. Wait 2-3 minutes for provisioning

### **2. Get Internal Database URL**

After database is created:

1. Click on your database in Render Dashboard
2. Scroll to **"Connections"** section
3. Copy the **"Internal Database URL"**
   ```
   postgresql://postgres:xxxxx@dpg-xxxxx.render.com:5432/fascinito_pos
   ```

### **3. Update Backend Environment Variables**

In your backend web service on Render:

1. Go to **Environment** tab
2. Add/Update these variables:
   ```
   DATABASE_URL = postgresql://postgres:baNNYGwXLgEgt4747PuPHoV9Ng68CTnd@dpg-xxxxx.render.com:5432/fascinito_pos
   HIBERNATE_DIALECT = org.hibernate.dialect.PostgreSQLDialect
   ```
3. **Remove** these MySQL variables (if present):
   ```
   ❌ DB_HOST
   ❌ DB_PORT
   ❌ DB_NAME
   ❌ DB_USER
   ❌ DB_PASSWORD
   ```

### **4. Keep These Environment Variables**

```
SERVER_PORT=8080
JWT_SECRET=zHpD5CEj8eiZVbGqcY7JNyY9p/fTlrYxLlQbGJ3KXQEkLwCExVyDBBmtB6PCOGVctor18vtVTOJVQfqi6dZU1Q==
JWT_ACCESS_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=604800000
CORS_ORIGINS=https://fascinito.in,https://www.fascinito.in
UPLOAD_BASE_PATH=/var/data/uploads
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_razorpay_secret
RAZORPAY_CURRENCY=INR
LOG_LEVEL=INFO
SHOW_SQL=false
SPRING_PROFILES_ACTIVE=production
```

### **5. Deploy**

1. Click **"Manual Deploy"** or push to GitHub
2. Render will build and deploy
3. Watch logs for successful startup:
   ```
   ✅ Started PosBackendApplication in X seconds
   ✅ Using PostgreSQL dialect
   ```

---

## 🔄 Database Migration (MySQL → PostgreSQL)

If you have existing data in MySQL that needs to be migrated:

### **Option 1: Export/Import SQL**

```bash
# Export from MySQL
mysqldump -u root -p pos_db > backup.sql

# Modify SQL for PostgreSQL compatibility
# (Change AUTO_INCREMENT to SERIAL, etc.)

# Import to PostgreSQL on Render
psql postgresql://postgres:password@dpg-xxxxx.render.com:5432/fascinito_pos < backup.sql
```

### **Option 2: Use pgLoader (Automatic)**

```bash
pgloader mysql://root:password@localhost/pos_db \
         postgresql://postgres:password@dpg-xxxxx.render.com:5432/fascinito_pos
```

### **Option 3: Fresh Start**

Since you have `ddl-auto: update`, Hibernate will create tables automatically:
- Deploy to Render
- Tables will be created on first run
- Start fresh with no data migration

---

## 🧪 Testing

### **Test Local MySQL Connection**

```bash
# Start Docker
docker-compose up -d

# Run application
mvn spring-boot:run

# Should see:
# Using MySQL dialect
# Connected to MySQL
```

### **Test Production PostgreSQL Connection**

```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres:baNNYGwXLgEgt4747PuPHoV9Ng68CTnd@dpg-xxxxx.render.com:5432/fascinito_pos"
export HIBERNATE_DIALECT="org.hibernate.dialect.PostgreSQLDialect"

# Run application
mvn spring-boot:run

# Should see:
# Using PostgreSQL dialect
# Connected to PostgreSQL
```

---

## 📊 Comparison

| Feature | MySQL (Local) | PostgreSQL (Render) |
|---------|---------------|---------------------|
| **Cost** | Free | Free (with limits) |
| **Setup** | Docker Compose | Render Dashboard |
| **Connection** | localhost:3306 | Internal URL |
| **Driver** | mysql-connector-j | postgresql |
| **Dialect** | MySQLDialect | PostgreSQLDialect |
| **Performance** | Local (fast) | Cloud (network latency) |

---

## ⚠️ Important Notes

### **1. Database Drivers**

Both drivers are included in `pom.xml`:
```xml
<!-- MySQL for local -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
</dependency>

<!-- PostgreSQL for Render -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
```

### **2. Dialect Auto-Detection**

Spring Boot automatically detects the database type from the URL, but we explicitly set it via `HIBERNATE_DIALECT` for clarity.

### **3. Connection Pooling**

Both MySQL and PostgreSQL use HikariCP (Spring Boot default) for connection pooling.

### **4. Schema Differences**

Be aware of SQL differences:
- **AUTO_INCREMENT** (MySQL) vs **SERIAL** (PostgreSQL)
- **TINYINT** (MySQL) vs **SMALLINT** (PostgreSQL)
- Date/time functions may differ

JPA/Hibernate handles most of these automatically.

---

## 🆘 Troubleshooting

### **"Cannot load driver class: org.postgresql.Driver"**

✅ **Fixed:** PostgreSQL driver is already in `pom.xml`

### **"Unknown database 'pos_db'"**

✅ **Solution:** Create database locally:
```sql
CREATE DATABASE pos_db;
```

### **"Access denied for user"**

✅ **Solution:** Check your MySQL credentials in `.env.local`

### **"No suitable driver found for postgresql"**

✅ **Solution:** Rebuild project:
```bash
mvn clean package
```

---

## 📞 Quick Reference

**Local Development:**
```bash
docker-compose up -d
mvn spring-boot:run
```

**Deploy to Render:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
# Render auto-deploys
```

**Check Render Logs:**
```bash
# In Render Dashboard → Your Service → Logs
```

---

**Your app is now configured for dual-database support! 🎉**

- **Develop locally with MySQL** (Docker)
- **Deploy to production with PostgreSQL** (Render)
- **No code changes needed** - just environment variables!
