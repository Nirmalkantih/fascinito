package com.fascinito.pos.service;

import com.fascinito.pos.dto.customer.CustomerResponse;
import com.fascinito.pos.entity.Role;
import com.fascinito.pos.entity.User;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerService {

    private final UserRepository userRepository;

    public Page<CustomerResponse> getAllCustomers(Pageable pageable, String search, Boolean active) {
        Specification<User> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by ROLE_CUSTOMER
            predicates.add(criteriaBuilder.equal(
                root.join("roles").get("name"),
                Role.RoleType.ROLE_CUSTOMER
            ));
            
            // Search filter
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate emailPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("email")),
                    searchPattern
                );
                Predicate firstNamePredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("firstName")),
                    searchPattern
                );
                Predicate lastNamePredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("lastName")),
                    searchPattern
                );
                predicates.add(criteriaBuilder.or(emailPredicate, firstNamePredicate, lastNamePredicate));
            }
            
            // Active filter
            if (active != null) {
                predicates.add(criteriaBuilder.equal(root.get("active"), active));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        Page<User> customers = userRepository.findAll(spec, pageable);
        return customers.map(this::mapToResponse);
    }

    public CustomerResponse getCustomerById(Long id) {
        User customer = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        
        // Verify it's a customer
        boolean isCustomer = customer.getRoles().stream()
                .anyMatch(role -> role.getName() == Role.RoleType.ROLE_CUSTOMER);
        
        if (!isCustomer) {
            throw new ResourceNotFoundException("User is not a customer");
        }
        
        return mapToResponse(customer);
    }

    public CustomerResponse toggleCustomerStatus(Long id) {
        User customer = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        
        customer.setActive(!customer.getActive());
        User updatedCustomer = userRepository.save(customer);
        return mapToResponse(updatedCustomer);
    }

    public Long getCustomerCount() {
        return userRepository.countByRoles_Name(Role.RoleType.ROLE_CUSTOMER);
    }

    private CustomerResponse mapToResponse(User user) {
        CustomerResponse response = new CustomerResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhone(user.getPhone());
        response.setRoles(user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList()));
        response.setActive(user.getActive());
        response.setEmailVerified(user.getEmailVerified());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}
