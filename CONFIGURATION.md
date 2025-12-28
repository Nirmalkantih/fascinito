# Configuration Setup Guide

This document describes how to configure the Fascinito POS application locally and in production.

## ⚠️ Security Notice

**IMPORTANT**: The `application.yml` file contains sensitive credentials and should **NEVER** be committed to version control. This file is listed in `.gitignore` to prevent accidental commits.

## Local Setup

### 1. Create `application.yml`

Copy the example configuration file and customize it with your credentials:

```bash
cp backend/src/main/resources/application.yml.example backend/src/main/resources/application.yml
```

### 2. Update Credentials in `application.yml`

Edit `backend/src/main/resources/application.yml` and update the following sections:

#### Database Configuration
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/fascinito_pos
    username: postgres
    password: your_db_password
```

#### Email Configuration (Hostinger)
```yaml
spring:
  mail:
    host: smtp.hostinger.com
    port: 465
    username: your_email@domain.com
    password: your_app_password  # Use app-specific password from Hostinger
    from: your_email@domain.com
```

**Getting Hostinger App Password:**
1. Go to Hostinger Control Panel
2. Navigate to Email accounts
3. Create an app-specific password
4. Use that password in the configuration (NOT your regular password)

#### JWT Secret
```yaml
jwt:
  secret: your-very-secure-secret-key-at-least-32-characters-long
  access-token-expiration: 3600000  # 1 hour in ms
  refresh-token-expiration: 604800000  # 7 days in ms
```

#### Razorpay Configuration
```yaml
razorpay:
  key-id: rzp_test_your_test_key_id
  key-secret: your_test_key_secret
  currency: INR
```

#### CORS Configuration
```yaml
cors:
  allowed-origins: http://localhost:3000,http://localhost:5173
```

## Docker Setup

For Docker deployments, use environment variables instead of file configuration:

### Environment Variables

Set these in `docker-compose.yml` or `.env`:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fascinito_pos
DB_USER=fascinito_user
DB_PASSWORD=your_db_password

# Email (Hostinger)
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=your_email@domain.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@domain.com

# JWT
JWT_SECRET=your-very-secure-secret-key-at-least-32-characters-long

# Razorpay
RAZORPAY_KEY_ID=rzp_test_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_CURRENCY=INR

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=DEBUG
SHOW_SQL=false
```

### Running with Docker

```bash
# Update docker-compose.yml with your environment variables
docker-compose up -d
```

## Production Deployment

For production:

1. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault, etc.)
2. **Never hardcode credentials** in configuration files
3. **Use strong passwords** (minimum 32 characters for JWT secret)
4. **Enable HTTPS** for all communications
5. **Rotate credentials regularly**
6. **Use app-specific passwords** instead of main account passwords

Example environment setup:

```bash
export DB_HOST="prod-db-host"
export DB_USER="prod_user"
export DB_PASSWORD="strong-random-password"
export MAIL_USERNAME="noreply@fascinito.in"
export MAIL_PASSWORD="app-specific-password"
export JWT_SECRET="very-long-random-secret-key"
export RAZORPAY_KEY_ID="rzp_live_key_id"
export RAZORPAY_KEY_SECRET="live_key_secret"
```

## File Exclusions

The following files are excluded from version control and should be created locally:

- `backend/src/main/resources/application.yml` - Contains credentials
- `backend/src/main/resources/application-dev.yml` - Development config
- `backend/src/main/resources/application-prod.yml` - Production config
- `.env` - Environment variables

## Checklist

- [ ] Copy `application.yml.example` to `application.yml`
- [ ] Update database credentials
- [ ] Update email credentials (get app password from Hostinger)
- [ ] Set JWT secret (use strong random string)
- [ ] Update Razorpay credentials
- [ ] Set CORS origins for your domain
- [ ] Verify `.gitignore` includes `application.yml`
- [ ] Test email sending with `/admin/email-templates/1/send-test`
- [ ] Verify JWT token generation works
- [ ] Test Razorpay payment integration

## Troubleshooting

### Email Not Sending
- Verify `MAIL_HOST` and `MAIL_PORT` are correct
- Check if using **app-specific password** from Hostinger (not main password)
- Verify email address is correct and active in Hostinger
- Check backend logs: `docker logs pos-backend | grep -i mail`

### JWT Token Issues
- Ensure `JWT_SECRET` is set and consistent
- Verify secret is at least 32 characters long
- Check token expiration settings

### Database Connection Issues
- Verify database is running and accessible
- Check credentials match your database setup
- Ensure database and tables are created (Hibernate ddl-auto: update)

## References

- [Hostinger Email Setup](https://www.hostinger.com/)
- [Spring Boot Configuration](https://spring.io/projects/spring-boot)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
