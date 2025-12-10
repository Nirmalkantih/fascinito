package com.fascinito.pos.security;

import com.fascinito.pos.entity.User;
import com.fascinito.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String emailOrPhone) throws UsernameNotFoundException {
        // Try to find user by email or phone (excluding deleted users)
        User user = userRepository.findByEmailAndDeletedFalse(emailOrPhone)
                .or(() -> userRepository.findByPhoneAndDeletedFalse(emailOrPhone))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email or phone: " + emailOrPhone));

        // Use phone as username if email is not available
        String username = user.getEmail() != null && !user.getEmail().trim().isEmpty() 
                ? user.getEmail() 
                : user.getPhone();

        return new org.springframework.security.core.userdetails.User(
                username,
                user.getPassword(),
                user.getActive(),
                true,
                true,
                true,
                getAuthorities(user)
        );
    }

    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        return user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());
    }
}
