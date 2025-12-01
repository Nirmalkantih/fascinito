package com.fascinito.pos.service;

import com.fascinito.pos.dto.staff.StaffRequest;
import com.fascinito.pos.dto.staff.StaffResponse;
import com.fascinito.pos.entity.Role;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.exception.BadRequestException;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.RoleRepository;
import com.fascinito.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<StaffResponse> getAllStaff(Pageable pageable, String search, Boolean active) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filter to only get ADMIN and STAFF roles (exclude customers)
            predicates.add(root.join("roles").get("name").in(
                Role.RoleType.ROLE_ADMIN, 
                Role.RoleType.ROLE_STAFF
            ));

            if (search != null && !search.trim().isEmpty()) {
                String searchTerm = "%" + search.toLowerCase() + "%";
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), searchTerm);
                Predicate firstNamePredicate = cb.like(cb.lower(root.get("firstName")), searchTerm);
                Predicate lastNamePredicate = cb.like(cb.lower(root.get("lastName")), searchTerm);
                predicates.add(cb.or(emailPredicate, firstNamePredicate, lastNamePredicate));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> staffPage = userRepository.findAll(spec, pageable);
        return staffPage.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public StaffResponse getStaffById(Long id) {
        log.debug("Fetching staff with id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + id));
        
        // Verify user is staff/admin
        boolean isStaff = user.getRoles().stream()
                .anyMatch(role -> role.getName() == Role.RoleType.ROLE_ADMIN || 
                                 role.getName() == Role.RoleType.ROLE_STAFF);
        
        if (!isStaff) {
            throw new BadRequestException("User is not a staff member");
        }
        
        return mapToResponse(user);
    }

    @Transactional
    public StaffResponse createStaff(StaffRequest request) {
        log.debug("Creating new staff: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists: " + request.getEmail());
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setActive(request.getActive() != null ? request.getActive() : true);
        user.setEmailVerified(false);

        // Set roles
        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            for (String roleName : request.getRoles()) {
                try {
                    Role.RoleType roleType = Role.RoleType.valueOf(roleName);
                    // Only allow ADMIN and STAFF roles
                    if (roleType == Role.RoleType.ROLE_ADMIN || roleType == Role.RoleType.ROLE_STAFF) {
                        Role role = roleRepository.findByName(roleType)
                                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
                        roles.add(role);
                    }
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid role: " + roleName);
                }
            }
        } else {
            // Default to STAFF role
            Role staffRole = roleRepository.findByName(Role.RoleType.ROLE_STAFF)
                    .orElseThrow(() -> new ResourceNotFoundException("ROLE_STAFF not found"));
            roles.add(staffRole);
        }
        
        user.setRoles(roles);
        User savedUser = userRepository.save(user);
        
        log.info("Staff created successfully with id: {}", savedUser.getId());
        return mapToResponse(savedUser);
    }

    @Transactional
    public StaffResponse updateStaff(Long id, StaffRequest request) {
        log.debug("Updating staff with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + id));

        // Check if email is being changed and if it already exists
        if (!user.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists: " + request.getEmail());
        }

        user.setEmail(request.getEmail());
        
        // Only update password if provided
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setActive(request.getActive() != null ? request.getActive() : user.getActive());

        // Update roles if provided
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            for (String roleName : request.getRoles()) {
                try {
                    Role.RoleType roleType = Role.RoleType.valueOf(roleName);
                    if (roleType == Role.RoleType.ROLE_ADMIN || roleType == Role.RoleType.ROLE_STAFF) {
                        Role role = roleRepository.findByName(roleType)
                                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
                        roles.add(role);
                    }
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid role: " + roleName);
                }
            }
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);
        
        log.info("Staff updated successfully with id: {}", id);
        return mapToResponse(updatedUser);
    }

    @Transactional
    public void deleteStaff(Long id) {
        log.debug("Deleting staff with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + id));

        userRepository.delete(user);
        log.info("Staff deleted successfully with id: {}", id);
    }

    private StaffResponse mapToResponse(User user) {
        StaffResponse response = new StaffResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhone(user.getPhone());
        response.setActive(user.getActive());
        response.setEmailVerified(user.getEmailVerified());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        
        Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());
        response.setRoles(roleNames);
        
        return response;
    }
}
