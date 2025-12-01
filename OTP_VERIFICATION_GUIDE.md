# OTP Verification System

## Overview
This system implements a two-step phone verification process for user signup using OTP (One-Time Password).

## Features

### Frontend (React)
- **Two-step signup process**:
  1. Step 1: Enter user details (name, phone, email, password)
  2. Step 2: Verify phone number with OTP
- **Phone number validation**: Validates phone format before sending OTP
- **Real-time OTP input**: 6-digit numeric input with formatting
- **Resend OTP**: 60-second countdown timer with resend option
- **Visual stepper**: Shows progress through signup steps

### Backend (Spring Boot)
- **OTP Generation**: Generates secure 6-digit random OTP
- **OTP Storage**: Stores OTPs in database with expiry time
- **OTP Validation**: Verifies OTP matches and hasn't expired
- **Security**: OTPs expire after 5 minutes
- **Cleanup**: Automatic cleanup of expired OTPs

## API Endpoints

### 1. Send OTP
```
POST /auth/send-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}

Response:
{
  "status": "success",
  "message": "OTP sent successfully",
  "data": null
}
```

### 2. Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456"
}

Response:
{
  "status": "success",
  "message": "OTP verified successfully",
  "data": null
}
```

### 3. Signup (After OTP Verification)
```
POST /auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "email": "john@example.com",  // Optional
  "password": "password123"
}
```

## Phone Number Validation

The system accepts various phone number formats:
- `1234567890`
- `+1234567890`
- `(123) 456-7890`
- `123-456-7890`

Regex pattern: `^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$`

## Database Schema

```sql
CREATE TABLE otp_verification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expiry_time DATETIME NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    INDEX idx_phone (phone),
    INDEX idx_expiry_time (expiry_time)
);
```

## Implementation Details

### OTP Expiry
- OTPs expire after 5 minutes
- Users can request a new OTP after expiry
- Resend functionality includes a 60-second cooldown

### Security Considerations
- OTPs are 6 digits for user convenience
- SecureRandom is used for generation
- OTPs are stored with expiry time
- Only the most recent unverified OTP is considered valid
- OTPs are marked as verified after successful validation

### SMS Integration (TODO)

Currently, OTPs are logged to the console for development purposes. In production, you should integrate with an SMS service:

**Popular SMS Services:**
1. **Twilio** - Easy integration, reliable
2. **AWS SNS** - Good for AWS infrastructure
3. **Firebase Cloud Messaging** - Free tier available
4. **MessageBird** - Good international coverage

**Example Twilio Integration:**
```java
@Service
public class SmsService {
    private final TwilioRestClient twilioClient;
    
    public void sendSms(String phone, String message) {
        Message.creator(
            new PhoneNumber(phone),
            new PhoneNumber("YOUR_TWILIO_NUMBER"),
            message
        ).create(twilioClient);
    }
}
```

Update `OtpService.sendOtp()` to use the SMS service instead of logging.

## Testing

### Development Testing
1. Go to http://localhost:3000/signup
2. Fill in user details with a valid phone number
3. Click "Send OTP"
4. Check backend logs for the OTP:
   ```
   docker logs pos-backend --tail 50
   ```
5. Enter the OTP from logs
6. Complete signup

### Production Testing
- Use a test phone number initially
- Monitor delivery rates
- Check SMS provider logs
- Verify OTP expiry works correctly

## User Flow

```
1. User enters signup details
   └─> Frontend validates phone format
       └─> User clicks "Send OTP"
           └─> POST /auth/send-otp
               └─> Backend generates & stores OTP
                   └─> SMS service sends OTP to phone
                       └─> User receives SMS
                           └─> User enters OTP
                               └─> POST /auth/verify-otp
                                   └─> Backend validates OTP
                                       └─> POST /auth/signup
                                           └─> Account created & user logged in
```

## Error Handling

- Invalid phone format → "Please enter a valid phone number"
- OTP sending failed → "Failed to send OTP. Please try again."
- Invalid OTP → "Invalid OTP. Please try again."
- Expired OTP → "Invalid or expired OTP"
- Missing fields → "Please fill in all required fields"

## Future Enhancements

1. **Rate Limiting**: Prevent OTP spam (e.g., max 3 OTPs per phone per hour)
2. **SMS Service Integration**: Replace logging with actual SMS sending
3. **Phone Number Verification**: Verify number is valid and can receive SMS
4. **Internationalization**: Support international phone formats better
5. **Alternative Verification**: Email or WhatsApp as backup verification
6. **Analytics**: Track OTP success/failure rates
