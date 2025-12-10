package com.fascinito.pos.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FirebaseLoginRequest {
    @NotBlank(message = "Firebase ID token is required")
    private String idToken;
}
