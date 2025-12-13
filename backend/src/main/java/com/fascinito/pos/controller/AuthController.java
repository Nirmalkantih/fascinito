package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.auth.AuthResponse;
import com.fascinito.pos.dto.auth.FirebaseLoginRequest;
import com.fascinito.pos.dto.auth.ForgotPasswordRequest;
import com.fascinito.pos.dto.auth.LoginRequest;
import com.fascinito.pos.dto.auth.RefreshTokenRequest;
import com.fascinito.pos.dto.auth.ResetPasswordRequest;
import com.fascinito.pos.dto.auth.SendOtpRequest;
import com.fascinito.pos.dto.auth.SignupRequest;
import com.fascinito.pos.dto.auth.VerifyOtpRequest;
import com.fascinito.pos.dto.auth.VerifyResetCodeRequest;
import com.fascinito.pos.service.AuthService;
import com.fascinito.pos.service.OtpService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.signup(request);
        
        // Set refresh token as HttpOnly secure cookie
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        
        // Remove refresh token from response body
        authResponse.setRefreshToken(null);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        
        // Set refresh token as HttpOnly secure cookie
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        
        // Remove refresh token from response body
        authResponse.setRefreshToken(null);
        
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/firebase-login")
    public ResponseEntity<ApiResponse<AuthResponse>> firebaseLogin(
            @Valid @RequestBody FirebaseLoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.firebaseLogin(request);
        
        // Set refresh token as HttpOnly secure cookie
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        
        // Remove refresh token from response body
        authResponse.setRefreshToken(null);
        
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @GetMapping("/check-phone")
    public ResponseEntity<ApiResponse<Boolean>> checkPhoneExists(@RequestParam String phone) {
        boolean exists = authService.phoneExists(phone);
        return ResponseEntity.ok(ApiResponse.success(
            exists ? "Phone number already registered" : "Phone number available",
            exists
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {
        // Extract refresh token from cookie
        String refreshToken = extractRefreshTokenFromCookie(request);
        
        if (refreshToken == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Refresh token not found"));
        }
        
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken(refreshToken);
        
        AuthResponse authResponse = authService.refreshToken(refreshRequest);
        
        // Set new refresh token as HttpOnly secure cookie (if backend generates new one)
        if (authResponse.getRefreshToken() != null) {
            setRefreshTokenCookie(response, authResponse.getRefreshToken());
        }
        
        // Remove refresh token from response body
        authResponse.setRefreshToken(null);
        
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout(
            Authentication authentication,
            HttpServletResponse response) {
        authService.logout(authentication.getName());
        
        // Clear refresh token cookie
        clearRefreshTokenCookie(response);
        
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<?>> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.sendPasswordResetCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Password reset code sent to email", null));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<ApiResponse<?>> verifyResetCode(@RequestBody VerifyResetCodeRequest request) {
        authService.verifyResetCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("Reset code verified successfully", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<?>> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<?>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        otpService.sendOtp(request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<?>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean verified = otpService.verifyOtp(request.getPhone(), request.getOtp());
        if (!verified) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid or expired OTP"));
        }
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", null));
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<ApiResponse<?>> deleteAccount(
            Authentication authentication,
            HttpServletResponse response) {
        // Delete the user account
        authService.deleteAccount(authentication.getName());
        
        // Clear refresh token cookie
        clearRefreshTokenCookie(response);
        
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully", null));
    }
    
    /**
     * Helper method to set refresh token as HttpOnly secure cookie
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .sameSite("Lax") // Changed from "Strict" to "Lax" for better compatibility
                .path("/api/auth")
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .build();
        
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
    
    /**
     * Helper method to extract refresh token from cookie
     */
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            return Arrays.stream(cookies)
                    .filter(cookie -> "refreshToken".equals(cookie.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }
    
    /**
     * Helper method to clear refresh token cookie
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(0) // Expire immediately
                .build();
        
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
