package com.fascinito.pos.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Set<String> roles;
    private Boolean active;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Note: We don't return actual password for security reasons
    // Frontend should leave password field empty when editing (only fill if changing password)
}
