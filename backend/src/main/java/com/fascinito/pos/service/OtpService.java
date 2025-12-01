package com.fascinito.pos.service;

import com.fascinito.pos.entity.OtpVerification;
import com.fascinito.pos.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {
    
    private final OtpVerificationRepository otpRepository;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final SecureRandom random = new SecureRandom();
    
    /**
     * Generate a 6-digit OTP
     */
    private String generateOtp() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
    
    /**
     * Send OTP to phone number
     */
    @Transactional
    public void sendOtp(String phone) {
        String otp = generateOtp();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);
        
        OtpVerification otpVerification = OtpVerification.builder()
                .phone(phone)
                .otp(otp)
                .expiryTime(expiryTime)
                .verified(false)
                .build();
        
        otpRepository.save(otpVerification);
        
        // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
        // For now, we'll just log it (REMOVE IN PRODUCTION!)
        log.info("OTP for phone {}: {} (Expires at: {})", phone, otp, expiryTime);
        
        // In production, send SMS:
        // smsService.sendSms(phone, "Your verification code is: " + otp);
    }
    
    /**
     * Verify OTP
     */
    @Transactional
    public boolean verifyOtp(String phone, String otp) {
        OtpVerification otpVerification = otpRepository
                .findTopByPhoneAndVerifiedFalseOrderByCreatedAtDesc(phone)
                .orElse(null);
        
        if (otpVerification == null) {
            log.warn("No OTP found for phone: {}", phone);
            return false;
        }
        
        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            log.warn("OTP expired for phone: {}", phone);
            return false;
        }
        
        if (!otpVerification.getOtp().equals(otp)) {
            log.warn("Invalid OTP for phone: {}", phone);
            return false;
        }
        
        // Mark as verified
        otpVerification.setVerified(true);
        otpRepository.save(otpVerification);
        
        log.info("OTP verified successfully for phone: {}", phone);
        return true;
    }
    
    /**
     * Clean up expired OTPs
     */
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteByExpiryTimeBefore(LocalDateTime.now());
    }
}
