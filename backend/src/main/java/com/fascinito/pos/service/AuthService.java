package com.fascinito.pos.service;

import com.fascinito.pos.dto.auth.AuthResponse;
import com.fascinito.pos.dto.auth.FirebaseLoginRequest;
import com.fascinito.pos.dto.auth.LoginRequest;
import com.fascinito.pos.dto.auth.RefreshTokenRequest;
import com.fascinito.pos.dto.auth.SignupRequest;
import com.fascinito.pos.entity.RefreshToken;
import com.fascinito.pos.entity.Role;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.exception.BadRequestException;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.RefreshTokenRepository;
import com.fascinito.pos.repository.RoleRepository;
import com.fascinito.pos.repository.UserRepository;
import com.fascinito.pos.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        // Check if phone already exists (phone is now the unique identifier)
        if (userRepository.existsByPhoneAndDeletedFalse(request.getPhone())) {
            throw new BadRequestException("Phone number is already registered!");
        }
        
        // Check if email is provided and already exists
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() 
            && userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new BadRequestException("Email is already taken!");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail() != null && !request.getEmail().trim().isEmpty() 
            ? request.getEmail() : null);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setActive(true);

        Role customerRole = roleRepository.findByName(Role.RoleType.ROLE_CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_CUSTOMER"));

        Set<Role> roles = new HashSet<>();
        roles.add(customerRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Use phone as username if email is not provided
        String username = savedUser.getEmail() != null ? savedUser.getEmail() : savedUser.getPhone();
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = createRefreshToken(savedUser);

        return buildAuthResponse(savedUser, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        // Try to find user by email or phone
        User user = userRepository.findByEmailAndDeletedFalse(userDetails.getUsername())
                .or(() -> userRepository.findByPhoneAndDeletedFalse(userDetails.getUsername()))
                .orElseThrow(() -> new ResourceNotFoundException("User", "email or phone", request.getEmail()));

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = createRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse firebaseLogin(FirebaseLoginRequest request) {
        try {
            // Decode Firebase ID token (JWT) to get phone number
            String[] parts = request.getIdToken().split("\\.");
            if (parts.length != 3) {
                throw new BadRequestException("Invalid Firebase ID token format");
            }

            // Decode the payload (second part)
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            ObjectMapper mapper = new ObjectMapper();
            JsonNode payloadNode = mapper.readTree(payload);

            // Extract phone number from the token
            String phoneNumber = payloadNode.has("phone_number") 
                ? payloadNode.get("phone_number").asText() 
                : null;

            if (phoneNumber == null || phoneNumber.isEmpty()) {
                throw new BadRequestException("Phone number not found in Firebase token");
            }

            System.out.println("Firebase phone from token: " + phoneNumber);

            // Try to find user - first with exact match (E.164 format)
            User user = userRepository.findByPhoneAndDeletedFalse(phoneNumber).orElse(null);
            
            // If not found, try normalized version (without country code)
            if (user == null) {
                String normalizedPhone = phoneNumber;
                if (phoneNumber.startsWith("+91")) {
                    normalizedPhone = phoneNumber.substring(3); // Remove +91
                } else if (phoneNumber.startsWith("+")) {
                    normalizedPhone = phoneNumber.substring(1); // Remove +
                }
                
                System.out.println("Trying normalized phone: " + normalizedPhone);
                user = userRepository.findByPhoneAndDeletedFalse(normalizedPhone).orElse(null);
            }
            
            if (user == null) {
                throw new ResourceNotFoundException("User", "phone", phoneNumber);
            }

            System.out.println("Found user: " + user.getId() + ", active: " + user.getActive());

            if (!user.getActive()) {
                throw new BadRequestException("User account is not active");
            }

            // Use phone as username for UserDetails
            String username = user.getPhone();
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
            String refreshToken = createRefreshToken(user);

            return buildAuthResponse(user, accessToken, refreshToken);
        } catch (Exception e) {
            throw new BadRequestException("Failed to authenticate with Firebase token: " + e.getMessage());
        }
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenAndRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Refresh token has expired");
        }

        User user = refreshToken.getUser();
        // Use phone as username if email is not available
        String username = user.getEmail() != null && !user.getEmail().trim().isEmpty() 
                ? user.getEmail() 
                : user.getPhone();
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);

        return buildAuthResponse(user, newAccessToken, refreshToken.getToken());
    }

    @Transactional
    public void logout(String emailOrPhone) {
        User user = userRepository.findByEmailAndDeletedFalse(emailOrPhone)
                .or(() -> userRepository.findByPhoneAndDeletedFalse(emailOrPhone))
                .orElseThrow(() -> new ResourceNotFoundException("User", "email or phone", emailOrPhone));
        refreshTokenRepository.deleteByUser(user);
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);

        // Use phone as username if email is not available
        String username = user.getEmail() != null && !user.getEmail().trim().isEmpty() 
                ? user.getEmail() 
                : user.getPhone();
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String token = jwtTokenProvider.generateRefreshToken(userDetails);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(token);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);
        return token;
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public void sendPasswordResetCode(String email) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Generate 6-digit reset code
        String resetCode = String.format("%06d", new Random().nextInt(999999));

        // Store reset code in user entity (you'll need to add resetCode and resetCodeExpiry fields to User)
        user.setResetCode(resetCode);
        user.setResetCodeExpiry(LocalDateTime.now().plusHours(1)); // Expires in 1 hour

        userRepository.save(user);

        // In production, send email with reset code
        // For now, we'll just log it
        System.out.println("Reset code for " + email + ": " + resetCode);
    }

    @Transactional
    public void verifyResetCode(String email, String code) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (user.getResetCode() == null || user.getResetCodeExpiry() == null) {
            throw new BadRequestException("No reset code requested for this email");
        }

        if (LocalDateTime.now().isAfter(user.getResetCodeExpiry())) {
            user.setResetCode(null);
            user.setResetCodeExpiry(null);
            userRepository.save(user);
            throw new BadRequestException("Reset code has expired");
        }

        if (!user.getResetCode().equals(code)) {
            throw new BadRequestException("Invalid reset code");
        }
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Verify the reset code first
        verifyResetCode(email, code);

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetCode(null);
        user.setResetCodeExpiry(null);

        userRepository.save(user);

        // Revoke all refresh tokens
        refreshTokenRepository.deleteByUser(user);
    }

    @Transactional
    public void deleteAccount(String emailOrPhone) {
        User user = userRepository.findByEmailAndDeletedFalse(emailOrPhone)
                .or(() -> userRepository.findByPhoneAndDeletedFalse(emailOrPhone))
                .orElseThrow(() -> new ResourceNotFoundException("User", "email or phone", emailOrPhone));

        // Soft delete: Mark as deleted instead of physically removing
        user.setDeleted(true);
        user.setDeletedAt(LocalDateTime.now());
        user.setActive(false); // Also deactivate the account
        
        userRepository.save(user);

        // Delete all refresh tokens to immediately log out the user
        refreshTokenRepository.deleteByUser(user);
    }
}
